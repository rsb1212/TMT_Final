package com.testmgmt.repository;

import com.testmgmt.entity.CallAttachment;
import com.testmgmt.entity.QACall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CallAttachmentRepository extends JpaRepository<CallAttachment, UUID> {
    List<CallAttachment> findByQaCall(QACall call);
    void deleteByQaCall(QACall call);
}
