package com.pocketarc.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdateGoalRequest {

    private String name;
    private BigDecimal targetAmount;
    private String category;
    private String coverImageBase64;
    private Boolean removeImage = false;
}