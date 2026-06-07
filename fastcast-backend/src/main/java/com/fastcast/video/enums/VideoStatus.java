package com.fastcast.video.enums;

public enum VideoStatus {
    UPLOADED,       // raw file received
    PROCESSING,     // FFmpeg job running
    READY,          // HLS chunks ready to stream
    FAILED          // processing failed
}