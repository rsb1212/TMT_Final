package com.testmgmt.enums;

/**
 * Type of a PD/CR call, derived from the Excel "Category" column.
 * PD     = Product Development call
 * CR     = Change Request
 * NR_CR  = Non-Release Change Request (Excel value "NR-CR")
 * OTHER  = anything that doesn't map cleanly
 */
public enum PdCrCallType {
    PD,
    CR,
    NR_CR,
    OTHER;

    /** Map a raw Excel category string (e.g. "NR-CR", "CR", "PD") to an enum value. */
    public static PdCrCallType fromCategory(String raw) {
        if (raw == null) return OTHER;
        String v = raw.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        return switch (v) {
            case "PD"      -> PD;
            case "CR"      -> CR;
            case "NR_CR"   -> NR_CR;
            default        -> OTHER;
        };
    }
}
