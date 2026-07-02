const cameras = [];

const detections = [
  {
    id: 1,
    event_id: 1,
    object_type: 'Vehicle',
    confidence: 0.95,
    bounding_box: { x: 120, y: 80, width: 200, height: 150 },
    timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    attributes: [
      { attribute_type: 'color', attribute_value: 'Red', confidence: 0.88 },
      { attribute_type: 'color', attribute_value: 'Black', confidence: 0.92 },
      { attribute_type: 'equipment', attribute_value: 'None', confidence: 0.95 },
    ],
  },
  {
    id: 2,
    event_id: 2,
    object_type: 'Person',
    confidence: 0.98,
    bounding_box: { x: 50, y: 100, width: 80, height: 200 },
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    attributes: [
      { attribute_type: 'color', attribute_value: 'Blue', confidence: 0.85 },
      { attribute_type: 'equipment', attribute_value: 'Backpack', confidence: 0.91 },
      { attribute_type: 'clothing', attribute_value: 'Uniform', confidence: 0.87 },
    ],
  },
  {
    id: 3,
    event_id: 3,
    object_type: 'Person',
    confidence: 0.92,
    bounding_box: { x: 200, y: 150, width: 75, height: 180 },
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    attributes: [
      { attribute_type: 'color', attribute_value: 'Black', confidence: 0.89 },
      { attribute_type: 'equipment', attribute_value: 'Toolbox', confidence: 0.84 },
      { attribute_type: 'clothing', attribute_value: 'Dark', confidence: 0.86 },
    ],
  },
];

module.exports = { cameras, detections };
