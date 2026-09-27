ALTER TABLE cyber_memory
    ADD CONSTRAINT uq_cyber_memory_incident
    UNIQUE (incident_id);
