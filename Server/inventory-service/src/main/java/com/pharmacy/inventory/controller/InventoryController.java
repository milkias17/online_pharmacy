package com.pharmacy.inventory.controller;

import com.pharmacy.inventory.model.Medicine;
import com.pharmacy.inventory.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*") 
@RestController
@RequestMapping("/inventory/medicines")
public class InventoryController {

    @Autowired
    private InventoryService service;

    // 1. GET /inventory/medicines?name=param&pharmacyId=123
    @GetMapping
    public List<Medicine> getMedicines(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long pharmacyId) {
        return service.getMedicines(name, pharmacyId);
    }

    // 2. GET /inventory/medicines/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        Optional<Medicine> medicine = service.getMedicineById(id);
        return medicine.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 3. POST /inventory/medicines
    @PostMapping
    public ResponseEntity<Medicine> addMedicine(@RequestBody Medicine medicine) {
        Medicine created = service.addMedicine(medicine);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // 4. PATCH /inventory/medicines/{id}/stock?quantity=50&mode=SET
    @PatchMapping("/{id}/stock")
    public ResponseEntity<String> updateStock(
            @PathVariable Long id, 
            @RequestParam int quantity,
            @RequestParam(defaultValue = "SET") String mode) { 
        try {
            service.updateStock(id, quantity, mode);
            return ResponseEntity.ok("Stock updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. GET /inventory/medicines/batch?ids=1,2,3
    @GetMapping("/batch")
    public ResponseEntity<List<Medicine>> getBatchMedicines(@RequestParam List<Long> ids) {
        List<Medicine> medicines = service.getMedicinesByIdList(ids);
        return ResponseEntity.ok(medicines);
    }
}