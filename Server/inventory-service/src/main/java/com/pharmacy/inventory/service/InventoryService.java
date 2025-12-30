package com.pharmacy.inventory.service;

import com.pharmacy.inventory.model.Medicine;
import com.pharmacy.inventory.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {

    @Autowired
    private MedicineRepository repository;

    // 1.  Get All, Search by Name, or Filter by Pharmacy
    public List<Medicine> getMedicines(String name, Long pharmacyIdLong) {
        // Convert Long to String to match the Model definition
        String pharmacyId = (pharmacyIdLong != null) ? String.valueOf(pharmacyIdLong) : null;

        if (name != null && pharmacyId != null) {
            // Search inside a specific pharmacy
            return repository.findByNameContainingIgnoreCaseAndPharmacyId(name, pharmacyId);
        } else if (pharmacyId != null) {
            // Get everything in a specific pharmacy (Dashboard view)
            return repository.findByPharmacyId(pharmacyId);
        } else if (name != null) {
            // Global search (Customer view)
            return repository.findByNameContainingIgnoreCase(name);
        }
        // Return everything (Admin view or fallback)
        return repository.findAll();
    }

    // 2. Get Single Medicine (Required for Order Service validation)
    public Optional<Medicine> getMedicineById(Long id) {
        return repository.findById(id);
    }

    // 3. Add New Medicine
    public Medicine addMedicine(Medicine medicine) {
        return repository.save(medicine);
    }

    // 4. Robust Stock Update
    // Handles 'SUBTRACT' (Orders) and 'SET' (Pharmacist corrections)
    @Transactional
    public void updateStock(Long medicineId, int quantity, String mode) {
        Medicine medicine = repository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        int currentStock = medicine.getStock();
        int newStock = currentStock;

        switch (mode.toUpperCase()) {
            case "ADD":
                newStock = currentStock + quantity;
                break;
            case "SUBTRACT":
                newStock = currentStock - quantity;
                break;
            case "SET":
                newStock = quantity; // Absolute update by pharmacist
                break;
            default:
                throw new RuntimeException("Invalid update mode: " + mode);
        }

        if (newStock < 0) {
            throw new RuntimeException("Insufficient stock. Current: " + currentStock);
        }

        medicine.setStock(newStock);
        repository.save(medicine);

        // Simple Pub/Sub simulation (Log)
        if (newStock < 5) {
            System.out.println("EVENT: inventory.low_stock | ID: " + medicineId);
        }

        String jsonMessage = "{\"type\":\"STOCK_LOW\", \"data\": {...}}";
        redisTemplate.convertAndSend("global_events", jsonMessage);
    }

    // 5. Batch Get
    public List<Medicine> getMedicinesByIdList(List<Long> ids) {
        return repository.findAllById(ids);
    }
}