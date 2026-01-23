package com.pharmacy.inventory.service;

import com.pharmacy.inventory.model.Medicine;
import com.pharmacy.inventory.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.data.redis.core.StringRedisTemplate; 
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class InventoryService {

    @Autowired
    private MedicineRepository repository;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    // --- REDIS CONFIGURATION ---
    @Autowired
    private StringRedisTemplate redisTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 1. Existing Method: Get All / Search
    public List<Medicine> getMedicines(String name, Long pharmacyIdLong) {
        String pharmacyId = (pharmacyIdLong != null) ? String.valueOf(pharmacyIdLong) : null;
        if (name != null && pharmacyId != null) {
            return repository.findByNameContainingIgnoreCaseAndPharmacyId(name, pharmacyId);
        } else if (pharmacyId != null) {
            return repository.findByPharmacyId(pharmacyId);
        } else if (name != null) {
            return repository.findByNameContainingIgnoreCase(name);
        }
        return repository.findAll();
    }

    // 2. Existing Method: Get By ID
    public Optional<Medicine> getMedicineById(Long id) {
        return repository.findById(id);
    }

    // 3. ADDED: Method for Batch API (Fixes Controller Error)
    public List<Medicine> getMedicinesByIdList(List<Long> ids) {
        return repository.findAllById(ids);
    }

    // 4. Existing Method: Add New
    public Medicine addMedicine(Medicine medicine) {
        return repository.save(medicine);
    }

    // 5. Robust Stock Update logic
    @Transactional
    public void updateStock(Long medicineId, int quantity, String mode) {
        Medicine medicine = repository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        int currentStock = medicine.getStock();
        int newStock = currentStock;

        switch (mode.toUpperCase()) {
            case "ADD": newStock = currentStock + quantity; break;
            case "SUBTRACT": newStock = currentStock - quantity; break;
            case "SET": newStock = quantity; break;
            default: throw new RuntimeException("Invalid update mode");
        }

        if (newStock < 0) throw new RuntimeException("Insufficient stock");

        medicine.setStock(newStock);
        repository.save(medicine);
        
        // --- REDIS EVENT: LOW STOCK ALERT ---
        if (newStock < 5) {
            try {
                Map<String, String> alertData = new HashMap<>();
                alertData.put("type", "STOCK_LOW");
                alertData.put("medicineName", medicine.getName());
                alertData.put("stock", String.valueOf(newStock));
                
                String jsonMessage = objectMapper.writeValueAsString(alertData);
                redisTemplate.convertAndSend("global_events", jsonMessage);
                System.out.println("📡 Redis: Published Low Stock alert for " + medicine.getName());
            } catch (Exception e) {
                System.err.println("❌ Redis Publish Error: " + e.getMessage());
            }
        }
    }

    // --- KAFKA DISTRIBUTED LOGIC (SAGA PATTERN) ---

    /**
     * SAGA STEP 1: Listen for Order Creation to RESERVE stock.
     */
    @KafkaListener(topics = "order_events", groupId = "inventory_group")
    public void handleOrderCreated(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            
            // ROBUST CHECK: Look for medicine_id OR medicineId
            JsonNode idNode = json.has("medicine_id") ? json.get("medicine_id") : json.get("medicineId");
            JsonNode qtyNode = json.has("quantity") ? json.get("quantity") : json.get("qty");

            if (idNode == null || qtyNode == null) {
                System.err.println("⚠️ Kafka: Received invalid JSON structure. Missing ID or Qty.");
                return;
            }

            Long medicineId = idNode.asLong();
            int requestedQty = qtyNode.asInt();
            String orderId = json.has("order_id") ? json.get("order_id").asText() : "unknown";

            System.out.println("📦 Kafka: Processing Order " + orderId + " for Medicine ID: " + medicineId);

            Optional<Medicine> medicine = repository.findById(medicineId);

            if (medicine.isPresent() && medicine.get().getStock() >= requestedQty) {
                String response = "{\"event\": \"STOCK_RESERVED\", \"order_id\": \"" + orderId + "\"}";
                kafkaTemplate.send("inventory_events", response);
                System.out.println("✅ Kafka: Stock reserved for " + orderId);
            } else {
                String response = "{\"event\": \"OUT_OF_STOCK\", \"order_id\": \"" + orderId + "\"}";
                kafkaTemplate.send("inventory_events", response);
                System.out.println("❌ Kafka: Out of stock for " + orderId);
            }
        } catch (Exception e) {
            System.err.println("❌ Kafka Consumption Error: " + e.getMessage());
        }
    }

    /**
     * SAGA STEP 2: Listen for Payment Success to DEDUCT stock permanently.
     */
    @KafkaListener(topics = "payment_events", groupId = "inventory_group")
    public void handlePaymentSuccess(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            if ("PAYMENT_SUCCESS".equals(json.get("event").asText())) {
                Long medicineId = json.get("medicine_id").asLong();
                int qty = json.get("quantity").asInt();
                
                // Perform the hard deduction in the DB
                updateStock(medicineId, qty, "SUBTRACT");
                System.out.println("💰 Kafka: Payment confirmed. Inventory updated permanently.");
            }
        } catch (Exception e) {
            System.err.println("❌ Kafka Payment Process Error: " + e.getMessage());
        }
    }
}
