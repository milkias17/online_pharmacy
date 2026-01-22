package com.pharmacy.inventory.service;

import com.pharmacy.inventory.model.Medicine;
import com.pharmacy.inventory.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {

    @Autowired
    private MedicineRepository repository;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

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

    // 3. Existing Method: Add New
    public Medicine addMedicine(Medicine medicine) {
        return repository.save(medicine);
    }

    // 4. Robust Stock Update logic
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
        
        if (newStock < 5) {
            System.out.println("ALERT: Stock for " + medicine.getName() + " is critical: " + newStock);
        }
    }

    // --- KAFKA DISTRIBUTED LOGIC ---

    /**
     * SAGA STEP 1: Listen for Order Creation to RESERVE stock.
     */
    @KafkaListener(topics = "order_events", groupId = "inventory_group")
    public void handleOrderCreated(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            Long medicineId = json.get("medicineId").asLong();
            int requestedQty = json.get("quantity").asInt();
            String orderId = json.get("order_id").asText();

            System.out.println("📦 Kafka: Received Order " + orderId + ". Checking stock...");

            Optional<Medicine> medicine = repository.findById(medicineId);

            if (medicine.isPresent() && medicine.get().getStock() >= requestedQty) {
                // Logic: In a real Saga, we might "Soft Lock" here.
                // For the demo, we send a success event.
                String response = "{\"event\": \"STOCK_RESERVED\", \"order_id\": \"" + orderId + "\"}";
                kafkaTemplate.send("inventory_events", response);
                System.out.println("✅ Kafka: Stock reserved for " + orderId);
            } else {
                String response = "{\"event\": \"OUT_OF_STOCK\", \"order_id\": \"" + orderId + "\"}";
                kafkaTemplate.send("inventory_events", response);
                System.out.println("❌ Kafka: Out of stock for " + orderId);
            }
        } catch (Exception e) {
            System.err.println("❌ Kafka Error: " + e.getMessage());
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
                Long medicineId = json.get("medicineId").asLong();
                int qty = json.get("quantity").asInt();
                
                // Perform the hard deduction in the DB
                updateStock(medicineId, qty, "SUBTRACT");
                System.out.println("💰 Kafka: Payment confirmed. Inventory updated permanently.");
            }
        } catch (Exception e) {
            System.err.println("❌ Kafka Error: " + e.getMessage());
        }
    }
}