package com.bookstudio.author.model;

import com.bookstudio.nationality.model.Nationality;
import com.bookstudio.shared.enums.Status;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "authors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Author {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long authorId;

    @Column(nullable = false, unique = true)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nationality_id", nullable = false)
    private Nationality nationality;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(columnDefinition = "TEXT")
    private String biography;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(length = 512)
    private String photoUrl;

    public Author(Long id) {
        this.authorId = id;
    }
}
