package com.bookstudio.book.controller;

import com.bookstudio.book.dto.BookResponseDto;
import com.bookstudio.book.dto.CreateBookDto;
import com.bookstudio.book.dto.UpdateBookDto;
import com.bookstudio.book.projection.BookInfoProjection;
import com.bookstudio.book.projection.BookListProjection;
import com.bookstudio.book.service.BookService;
import com.bookstudio.shared.util.ApiError;
import com.bookstudio.shared.util.ApiResponse;
import com.bookstudio.shared.util.SelectOptions;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<?> list() {
        List<BookListProjection> books = bookService.getList();
        if (books.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body(new ApiError(false, "No books found.", "no_content", 204));
        }
        return ResponseEntity.ok(books);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        BookInfoProjection book = bookService.getInfoById(id).orElse(null);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiError(false, "Book not found.", "not_found", 404));
        }
        return ResponseEntity.ok(book);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateBookDto dto) {
        try {
            BookResponseDto created = bookService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse(true, created));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiError(false, e.getMessage(), "creation_failed", 400));
        }
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody UpdateBookDto dto) {
        try {
            BookResponseDto updated = bookService.update(dto);
            return ResponseEntity.ok(new ApiResponse(true, updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiError(false, e.getMessage(), "update_failed", 404));
        }
    }

    @GetMapping("/select-options")
    public ResponseEntity<?> selectOptions() {
        try {
            SelectOptions options = bookService.getSelectOptions();

            if ((options.getAuthors() != null && !options.getAuthors().isEmpty()) ||
                    (options.getPublishers() != null && !options.getPublishers().isEmpty()) ||
                    (options.getCourses() != null && !options.getCourses().isEmpty()) ||
                    (options.getGenres() != null && !options.getGenres().isEmpty())) {

                return ResponseEntity.ok(options);
            } else {
                return ResponseEntity.status(HttpStatus.NO_CONTENT)
                        .body(new ApiError(false, "No select options found.", "no_content", 204));
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiError(false, "Error populating select options.", "server_error", 500));
        }
    }
}
