package com.testmgmt.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Attachment for a QACall — recording, screenshot, MoM doc, etc.
 */
@Entity
@Table(name = "call_attachments",
        indexes = @Index(name = "idx_ca_call", columnList = "qa_call_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CallAttachment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qa_call_id", nullable = false)
    private QACall qaCall;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id")
    private User uploadedBy;

    @Column(name = "is_recording")
    @Builder.Default
    private Boolean isRecording = false;
}
