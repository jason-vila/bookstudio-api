package com.bookstudio.reservation.controller;

import com.bookstudio.reservation.dto.CreateReservationDto;
import com.bookstudio.reservation.dto.UpdateReservationDto;
import com.bookstudio.reservation.dto.ReservationResponseDto;
import com.bookstudio.reservation.projection.ReservationInfoProjection;
import com.bookstudio.reservation.projection.ReservationListProjection;
import com.bookstudio.reservation.service.ReservationService;
import com.bookstudio.shared.util.ApiError;
import com.bookstudio.shared.util.ApiResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public ResponseEntity<?> list() {
        List<ReservationListProjection> reservations = reservationService.getList();
        if (reservations.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body(new ApiError(false, "No reservations found.", "no_content", 204));
        }
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        ReservationInfoProjection reservation = reservationService.getInfoById(id).orElse(null);
        if (reservation == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiError(false, "Reservation not found.", "not_found", 404));
        }
        return ResponseEntity.ok(reservation);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateReservationDto dto) {
        try {
            ReservationResponseDto created = reservationService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse(true, created));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiError(false, e.getMessage(), "creation_failed", 400));
        }
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody UpdateReservationDto dto) {
        try {
            ReservationResponseDto updated = reservationService.update(dto);
            return ResponseEntity.ok(new ApiResponse(true, updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiError(false, e.getMessage(), "update_failed", 404));
        }
    }
}
