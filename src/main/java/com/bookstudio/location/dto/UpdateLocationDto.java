package com.bookstudio.location.dto;

import java.util.List;

import lombok.Data;

@Data
public class UpdateLocationDto {
    private Long id;
    private String name;
    private String description;
    private List<UpdateShelfDto> shelves;
}
