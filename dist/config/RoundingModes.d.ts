export declare const enum DecimalRoundingModes {
    ROUND_UP = 0,// Away from zero.
    ROUND_DOWN = 1,// Towards zero.
    ROUND_CEIL = 2,// Towards +Infinity.
    ROUND_FLOOR = 3,// Towards -Infinity.
    ROUND_HALF_UP = 4,// Towards nearest neighbour. If equidistant, up.
    ROUND_HALF_DOWN = 5,// Towards nearest neighbour. If equidistant, down.
    ROUND_HALF_EVEN = 6,// Towards nearest neighbour. If equidistant, towards even neighbour.
    ROUND_HALF_CEIL = 7,// Towards nearest neighbour. If equidistant, towards +Infinity.
    ROUND_HALF_FLOOR = 8,// Towards nearest neighbour. If equidistant, towards -Infinity.
    EUCLID = 9
}
