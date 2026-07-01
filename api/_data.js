// Production: all data is fetched from the Neon database via DATABASE_URL.
// These arrays are empty ΓÇö no demo or mock data.
const cameras = [];
const detections = [];

module.exports = { cameras, detections };


const detections = [
  {
    id: 1,
    event_id: 1,
    object_type: 'Vehicle',
    confidence: 0.95,
    bounding_box: { x: 120, y: 80, width: 200, height: 150 },
    timestamp: '2024-06-21 14:32:15',
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
    timestamp: '2024-06-21 14:28:42',
    attributes: [
      { attribute_type: 'color', attribute_value: 'Blue', confidence: 0.85 },
      { attribute_type: 'equipment', attribute_value: 'Backpack', confidence: 0.91 },
      { attribute_type: 'clothing', attribute_value: 'Uniform', confidence: 0.87 },
    ],
  },
  {
    id: 3,
    event_id: 4,
    object_type: 'Person',
    confidence: 0.92,
    bounding_box: { x: 200, y: 150, width: 75, height: 180 },
    timestamp: '2024-06-21 13:55:33',
    attributes: [
      { attribute_type: 'color', attribute_value: 'Black', confidence: 0.89 },
      { attribute_type: 'equipment', attribute_value: 'Toolbox', confidence: 0.84 },
      { attribute_type: 'clothing', attribute_value: 'Dark', confidence: 0.86 },
    ],
  },
];

module.exports = {
  cameras,
  detections,
};
