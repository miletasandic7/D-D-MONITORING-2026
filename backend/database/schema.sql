-- D&D Global AI Surveillance Platform - Database Schema
-- Supports YOLO object detection attribute filtering

-- Events table with AI detection attributes
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    camera_id VARCHAR(20) NOT NULL REFERENCES cameras(id),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO',
    description TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Detection Results table
CREATE TABLE ai_detections (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    object_type VARCHAR(50) NOT NULL, -- Person, Vehicle, Animal, etc.
    confidence FLOAT NOT NULL,
    bounding_box JSONB, -- {x, y, width, height}
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Object Attributes table for filtering
CREATE TABLE object_attributes (
    id SERIAL PRIMARY KEY,
    detection_id INTEGER NOT NULL REFERENCES ai_detections(id) ON DELETE CASCADE,
    attribute_type VARCHAR(50) NOT NULL, -- color, equipment, clothing, etc.
    attribute_value VARCHAR(100) NOT NULL, -- Red, Black, Backpack, etc.
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cameras table
CREATE TABLE cameras (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rtsp_url VARCHAR(255),
    location VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    resolution VARCHAR(20),
    fps INTEGER,
    codec VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient filtering
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_camera_id ON events(camera_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_ai_detections_object_type ON ai_detections(object_type);
CREATE INDEX idx_ai_detections_event_id ON ai_detections(event_id);
CREATE INDEX idx_object_attributes_type ON object_attributes(attribute_type);
CREATE INDEX idx_object_attributes_value ON object_attributes(attribute_value);
CREATE INDEX idx_object_attributes_detection_id ON object_attributes(detection_id);

-- Composite index for attribute filtering
CREATE INDEX idx_attributes_composite ON object_attributes(attribute_type, attribute_value);

-- Sample data for testing
INSERT INTO cameras (id, name, rtsp_url, location, enabled, resolution, fps, codec) VALUES
('CAM-01', 'Main Entrance', 'rtsp://192.168.1.101:554/stream1', 'entrance', TRUE, '1920x1080', 30, 'H264'),
('CAM-02', 'Parking Lot', 'rtsp://192.168.1.102:554/stream1', 'parking', TRUE, '1920x1080', 30, 'H264'),
('CAM-03', 'Lobby', 'rtsp://192.168.1.103:554/stream1', 'lobby', TRUE, '1280x720', 25, 'H264'),
('CAM-04', 'Server Room', 'rtsp://192.168.1.104:554/stream1', 'server_room', TRUE, '1920x1080', 30, 'H264'),
('CAM-05', 'Warehouse A', 'rtsp://192.168.1.105:554/stream1', 'warehouse_a', TRUE, '1920x1080', 30, 'H264'),
('CAM-06', 'Warehouse B', 'rtsp://192.168.1.106:554/stream1', 'warehouse_b', TRUE, '1920x1080', 30, 'H264'),
('CAM-07', 'Loading Dock', 'rtsp://192.168.1.107:554/stream1', 'loading_dock', TRUE, '1280x720', 25, 'H264'),
('CAM-08', 'Perimeter North', 'rtsp://192.168.1.108:554/stream1', 'perimeter_north', TRUE, '1920x1080', 30, 'H264'),
('CAM-09', 'Perimeter South', 'rtsp://192.168.1.109:554/stream1', 'perimeter_south', TRUE, '1920x1080', 30, 'H264');

-- Sample events with AI detection data
INSERT INTO events (timestamp, camera_id, event_type, severity, description) VALUES
('2024-06-21 14:32:15', 'CAM-02', 'MOTION DETECTED', 'ALERT', 'Unauthorized vehicle detected in restricted parking zone near loading dock. Security team dispatched.'),
('2024-06-21 14:28:42', 'CAM-01', 'ACCESS GRANTED', 'INFO', 'Employee ID #4521 entered through main entrance. Badge verified successfully.'),
('2024-06-21 14:15:08', 'CAM-04', 'SYSTEM UPDATE', 'INFO', 'AI model updated to v2.4.1. Detection accuracy improved by 12%. All systems nominal.'),
('2024-06-21 13:55:33', 'CAM-04', 'DOOR FORCE', 'ALERT', 'Forced entry attempt detected at server room access point. Alarm triggered. No breach confirmed.'),
('2024-06-21 13:42:19', 'CAM-08', 'PERIMETER CHECK', 'INFO', 'Automated perimeter scan completed. No anomalies detected. All sensors operational.'),
('2024-06-21 13:30:00', 'CAM-01', 'SHIFT CHANGE', 'INFO', 'Security shift change completed. New team on duty. Handover documentation filed.');
