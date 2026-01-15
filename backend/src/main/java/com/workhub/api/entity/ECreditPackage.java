package com.workhub.api.entity;

import java.math.BigDecimal;

public enum ECreditPackage {
    BASIC(1, new BigDecimal("10000"), "1 Credit"),
    STANDARD(100, new BigDecimal("650000"), "100 Credits - Tiết kiệm 35%"),
    PREMIUM(1000, new BigDecimal("4250000"), "1000 Credits - Tiết kiệm 57.5%");

    private final int credits;
    private final BigDecimal price;
    private final String description;

    ECreditPackage(int credits, BigDecimal price, String description) {
        this.credits = credits;
        this.price = price;
        this.description = description;
    }

    public int getCredits() {
        return credits;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPricePerCredit() {
        return price.divide(BigDecimal.valueOf(credits), 0, java.math.RoundingMode.CEILING);
    }
}
