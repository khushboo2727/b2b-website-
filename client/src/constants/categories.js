// Central category taxonomy with subcategories (reusable across app)
export const CATEGORY_TREE = [
  { key: 'agriculture-food', name: 'Agriculture & Food', subcategories: [
    'Agricultural Machinery','Seeds & Seedlings','Fresh Produce',
    'Grains & Cereals','Pulses & Beans','Spices & Condiments',
    'Edible Oils','Dairy Products','Animal Feed','Agro Chemicals'
  ]},
  { key: 'apparel-accessories', name: 'Apparel & Accessories', subcategories: [
    'Men Clothing','Women Clothing','Kids Clothing','Ethnic Wear','Sportswear',
    'Innerwear & Lingerie','Footwear','Bags & Wallets','Belts & Accessories','Uniforms'
  ]},
  { key: 'arts-crafts', name: 'Arts & Crafts', subcategories: [
    'Handicrafts','Handmade Home Decor','Paintings & Frames','Sculptures',
    'Gift Packaging','DIY & Craft Supplies','Festival Decor','Religious Artifacts'
  ]},
  { key: 'auto-motorcycle-parts', name: 'Auto, Motorcycle Parts & Accessories', subcategories: [
    'Two-wheeler Parts','Four-wheeler Parts','Engine Components','Tyres & Tubes',
    'Batteries','Lubricants','Car Care & Accessories','Safety & Security'
  ]},
  { key: 'bags-cases-boxes', name: 'Bags, Cases & Boxes', subcategories: [
    'Backpacks','Trolley Bags','Handbags','Laptop Bags','Packaging Boxes',
    'Corrugated Boxes','Plastic Containers','Suitcases','Pouches'
  ]},
  { key: 'chemicals', name: 'Chemicals', subcategories: [
    'Industrial Chemicals','Agro Chemicals','Dyes & Pigments',
    'Water Treatment Chemicals','Adhesives & Sealants','Cleaning Chemicals','Petrochemicals'
  ]},
  { key: 'computer-products', name: 'Computer Products', subcategories: [
    'Laptops & Desktops','Monitors','Keyboards & Mice','Storage Devices',
    'PC Components','Networking Devices','Printers & Scanners','Software & Licenses'
  ]},
  { key: 'construction-decoration', name: 'Construction & Decoration', subcategories: [
    'Cement & Bricks','Tiles & Marble','Steel & Rebar','Paints & Coatings',
    'Doors & Windows','Sanitary Ware','Bathroom Fittings','False Ceiling & Panels','Glass & Glazing'
  ]},
  { key: 'consumer-electronics', name: 'Consumer Electronics', subcategories: [
    'TV & Entertainment','Audio Systems','Cameras & Accessories',
    'Home Appliances','Wearables','Power Banks','Smart Home Devices'
  ]},
  { key: 'electrical-electronics', name: 'Electrical & Electronics', subcategories: [
    'Cables & Wires','Switches & Sockets','MCB & Distribution','Motors & Drives',
    'Transformers','Industrial Controls','PCB & Components','Solar & Power Supplies'
  ]},
  { key: 'furniture', name: 'Furniture', subcategories: [
    'Home Furniture','Office Furniture','Modular Kitchens','Mattress & Bedding',
    'Outdoor Furniture','Furniture Hardware'
  ]},
  { key: 'health-medicine', name: 'Health & Medicine', subcategories: [
    'Pharmaceuticals','Nutraceuticals','Medical Devices','Hospital Supplies','Diagnostics',
    'Personal Care & Hygiene'
  ]},
  { key: 'industrial-equipment', name: 'Industrial Equipment & Components', subcategories: [
    'Pumps & Valves','Compressors','Material Handling','Bearings','Industrial Tools',
    'Hydraulics & Pneumatics','Power Generation','Welding Equipment'
  ]},
  { key: 'instruments-meters', name: 'Instruments & Meters', subcategories: [
    'Measuring Instruments','Laboratory Equipment','Test & Calibration','Sensors','Meters & Gauges'
  ]},
  { key: 'light-industry-daily-use', name: 'Light Industry & Daily Use', subcategories: [
    'Household Products','Kitchenware','Cleaning Supplies','Personal Utilities','Storage & Organizers'
  ]},
  { key: 'lights-lighting', name: 'Lights & Lighting', subcategories: [
    'LED Bulbs & Lamps','Outdoor Lighting','Indoor Lighting','Commercial Lighting',
    'Drivers & Power Supplies','Emergency & Solar Lighting'
  ]},
  { key: 'manufacturing-processing-machinery', name: 'Manufacturing & Processing Machinery', subcategories: [
    'Packaging Machines','Food Processing Machines','Plastic & Rubber Machinery',
    'Textile Machinery','CNC & Machine Tools','Printing Machinery'
  ]},
  { key: 'metallurgy-mineral-energy', name: 'Metallurgy, Mineral & Energy', subcategories: [
    'Metal Products','Ores & Minerals','Coal & Coke','Renewable Energy','Batteries & Storage'
  ]},
  { key: 'office-supplies', name: 'Office Supplies', subcategories: [
    'Stationery','Notebooks & Registers','Printers & Consumables','Office Machines',
    'Office Furniture','Files & Folders'
  ]},
  { key: 'packaging-printing', name: 'Packaging & Printing', subcategories: [
    'Flexible Packaging','Rigid Packaging','Labels & Stickers','Cartons & Boxes',
    'Printing Services','Packaging Materials'
  ]},
  { key: 'security-protection', name: 'Security & Protection', subcategories: [
    'CCTV & Surveillance','Access Control','Fire Safety','PPE & Safety Gear','Alarms & Sensors'
  ]},
  { key: 'services', name: 'Service', subcategories: [
    'Logistics','Repair & Maintenance','IT & Software','Consulting','Design & Branding','Payment & Finance'
  ]},
  { key: 'sporting-recreation', name: 'Sporting Goods & Recreation', subcategories: [
    'Fitness Equipment','Team Sports','Outdoor & Camping','Bicycles & Accessories','Games & Hobbies'
  ]},
  { key: 'textile', name: 'Textile', subcategories: [
    'Fabrics','Yarn & Threads','Home Textiles','Technical Textiles','Dyeing & Finishing'
  ]},
  { key: 'tools-hardware', name: 'Tools & Hardware', subcategories: [
    'Hand Tools','Power Tools','Fasteners','Abrasives','Cutting Tools','Locks & Fittings'
  ]},
  { key: 'toys', name: 'Toys', subcategories: [
    'Educational Toys','Baby Toys','Outdoor Toys','Board Games & Puzzles','Electronic Toys'
  ]},
  { key: 'transportation', name: 'Transportation', subcategories: [
    'Commercial Vehicles','Auto Parts','Tyres','EV & Components','Logistics & Fleet'
  ]},
  // Extras
  { key: 'beauty-personal-care', name: 'Beauty & Personal Care', subcategories: [
    'Skin Care','Hair Care','Cosmetics','Fragrances','Salon Equipment','Personal Hygiene'
  ]},
  { key: 'home-garden', name: 'Home & Garden', subcategories: [
    'Home Decor','Kitchen & Dining','Gardening','Cleaning Utilities','Storage & Organization'
  ]},
  { key: 'telecommunications', name: 'Telecommunications', subcategories: [
    'Mobiles & Tablets','Network Equipment','Fiber & Connectivity','Telecom Accessories'
  ]}
];

export const categoryNames = CATEGORY_TREE.map(c => c.name);
export const getSubcategories = (categoryName) =>
  CATEGORY_TREE.find(c => c.name === categoryName)?.subcategories || [];