ALTER TABLE mitre_mappings
    ADD CONSTRAINT uq_mitre_mapping_incident_technique
    UNIQUE (incident_id, technique_id);
