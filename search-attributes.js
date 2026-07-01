// Mock API Endpoint: /api/search/attributes
// Supports YOLO object detection attribute filtering

const express = require('express');
const router = express.Router();

// Mock database for demonstration
const mockDetections = [
    {
        id: 1,
        event_id: 1,
        object_type: 'Vehicle',
        confidence: 0.95,
        bounding_box: { x: 120, y: 80, width: 200, height: 150 },
        timestamp: '2024-06-21 14:32:15',
        attributes: [
            { type: 'color', value: 'Red', confidence: 0.88 },
            { type: 'color', value: 'Black', confidence: 0.92 },
            { type: 'equipment', value: 'None', confidence: 0.95 }
        ]
    },
    {
        id: 2,
        event_id: 2,
        object_type: 'Person',
        confidence: 0.98,
        bounding_box: { x: 50, y: 100, width: 80, height: 200 },
        timestamp: '2024-06-21 14:28:42',
        attributes: [
            { type: 'color', value: 'Blue', confidence: 0.85 },
            { type: 'equipment', value: 'Backpack', confidence: 0.91 },
            { type: 'clothing', value: 'Uniform', confidence: 0.87 }
        ]
    },
    {
        id: 3,
        event_id: 4,
        object_type: 'Person',
        confidence: 0.92,
        bounding_box: { x: 200, y: 150, width: 75, height: 180 },
        timestamp: '2024-06-21 13:55:33',
        attributes: [
            { type: 'color', value: 'Black', confidence: 0.89 },
            { type: 'equipment', value: 'Toolbox', confidence: 0.84 },
            { type: 'clothing', value: 'Dark', confidence: 0.86 }
        ]
    },
    {
        id: 4,
        event_id: 5,
        object_type: 'Vehicle',
        confidence: 0.94,
        bounding_box: { x: 300, y: 90, width: 180, height: 140 },
        timestamp: '2024-06-21 13:42:19',
        attributes: [
            { type: 'color', value: 'White', confidence: 0.91 },
            { type: 'equipment', value: 'None', confidence: 0.96 },
            { type: 'color', value: 'Silver', confidence: 0.88 }
        ]
    },
    {
        id: 5,
        event_id: 6,
        object_type: 'Person',
        confidence: 0.97,
        bounding_box: { x: 100, y: 120, width: 70, height: 190 },
        timestamp: '2024-06-21 13:30:00',
        attributes: [
            { type: 'color', value: 'Green', confidence: 0.83 },
            { type: 'equipment', value: 'Badge', confidence: 0.95 },
            { type: 'clothing', value: 'Formal', confidence: 0.89 }
        ]
    }
];

// GET /api/search/attributes
// Query parameters:
// - object_type: Filter by object type (Person, Vehicle, etc.)
// - color: Filter by color attribute (Red, Black, Blue, etc.)
// - equipment: Filter by equipment attribute (Backpack, Toolbox, Badge, etc.)
// - min_confidence: Minimum confidence threshold (default: 0.5)
// - start_date: Filter events after this date
// - end_date: Filter events before this date
router.get('/api/search/attributes', (req, res) => {
    try {
        const {
            object_type,
            color,
            equipment,
            min_confidence = 0.5,
            start_date,
            end_date
        } = req.query;

        let filteredResults = [...mockDetections];

        // Filter by object type
        if (object_type) {
            filteredResults = filteredResults.filter(
                detection => detection.object_type.toLowerCase() === object_type.toLowerCase()
            );
        }

        // Filter by color attribute
        if (color) {
            filteredResults = filteredResults.filter(detection =>
                detection.attributes.some(attr =>
                    attr.type === 'color' &&
                    attr.value.toLowerCase() === color.toLowerCase()
                )
            );
        }

        // Filter by equipment attribute
        if (equipment) {
            filteredResults = filteredResults.filter(detection =>
                detection.attributes.some(attr =>
                    attr.type === 'equipment' &&
                    attr.value.toLowerCase() === equipment.toLowerCase()
                )
            );
        }

        // Filter by minimum confidence
        filteredResults = filteredResults.filter(
            detection => detection.confidence >= parseFloat(min_confidence)
        );

        // Filter by date range
        if (start_date) {
            filteredResults = filteredResults.filter(
                detection => new Date(detection.timestamp) >= new Date(start_date)
            );
        }

        if (end_date) {
            filteredResults = filteredResults.filter(
                detection => new Date(detection.timestamp) <= new Date(end_date)
            );
        }

        res.json({
            success: true,
            count: filteredResults.length,
            results: filteredResults,
            filters: {
                object_type,
                color,
                equipment,
                min_confidence,
                start_date,
                end_date
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/search/attributes
// For complex filtering with JSON body
router.post('/api/search/attributes', (req, res) => {
    try {
        const filters = req.body;
        let filteredResults = [...mockDetections];

        // Apply all filters from request body
        if (filters.object_types && filters.object_types.length > 0) {
            filteredResults = filteredResults.filter(detection =>
                filters.object_types.includes(detection.object_type)
            );
        }

        if (filters.colors && filters.colors.length > 0) {
            filteredResults = filteredResults.filter(detection =>
                detection.attributes.some(attr =>
                    attr.type === 'color' &&
                    filters.colors.some(color =>
                        color.toLowerCase() === attr.value.toLowerCase()
                    )
                )
            );
        }

        if (filters.equipment && filters.equipment.length > 0) {
            filteredResults = filteredResults.filter(detection =>
                detection.attributes.some(attr =>
                    attr.type === 'equipment' &&
                    filters.equipment.some(eq =>
                        eq.toLowerCase() === attr.value.toLowerCase()
                    )
                )
            );
        }

        if (filters.min_confidence) {
            filteredResults = filteredResults.filter(
                detection => detection.confidence >= filters.min_confidence
            );
        }

        res.json({
            success: true,
            count: filteredResults.length,
            results: filteredResults,
            filters: filters
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
