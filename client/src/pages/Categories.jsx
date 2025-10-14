import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const sections = [
  {
    title: 'Industrial Supplies',
    image: '/images/categories/manufacture-steel-machine-with-control-computer-clear-room.jpg',
    columns: [
      {
        heading: 'Manufacturing & Processing Machinery',
        items: ['CNC Machines', 'Plastic Machinery', 'Food Processing', 'Textile Machinery', 'Woodworking'],
      },
      {
        heading: 'Industrial Equipment & Components',
        items: ['Bearings', 'Pumps', 'Valves', 'Compressors', 'Hydraulics & Pneumatics'],
      },
      {
        heading: 'Materials',
        items: ['Metals & Alloys', 'Plastics & Rubber', 'Composites', 'Industrial Ceramics', 'Abrasives'],
      },
      {
        heading: 'Packaging & Printing',
        items: ['Packaging Machines', 'Bottling', 'Labels & Tags', 'Printing Machinery', 'Cartons & Boxes'],
      },
    ],
  },
  {
    title: 'Home & Security',
    image: '/images/categories/Untitled design (6).png',
    columns: [
      { heading: 'Construction & Decoration', items: ['Doors & Windows', 'Flooring', 'Sanitary Ware', 'Tiles', 'Kitchen'] },
      { heading: 'Lights & Lighting', items: ['LED Lights', 'Outdoor Lighting', 'Commercial Lighting', 'Smart Lighting', 'Components'] },
      { heading: 'Furniture', items: ['Home Furniture', 'Office Furniture', 'Outdoor Furniture', 'Hotel Furniture', 'Kids Furniture'] },
      { heading: 'Security & Protection', items: ['CCTV', 'Access Control', 'Alarm', 'Safes', 'Locks & Keys'] },
    ],
  },
  {
    title: 'Transportation & Sporting Goods',
    image: '/images/categories/bicycle.png',
    columns: [
      { heading: 'Auto, Motorcycle Parts & Accessories', items: ['Auto Parts', 'Motorcycle Parts', 'Tires & Wheels', 'Batteries', 'Lubricants'] },
      { heading: 'Transport', items: ['E-Bikes', 'Electric Vehicles', 'Bicycles', 'ATVs', 'Scooters'] },
      { heading: 'Service', items: ['Maintenance', 'Repair', 'Logistics', 'Testing', 'Customization'] },
      { heading: 'Sporting Goods & Recreation', items: ['Fitness', 'Outdoor Sports', 'Camping', 'Water Sports', 'Games & Toys'] },
    ],
  },
  {
    title: 'Apparel & Light Industry',
    image: '/images/categories/Untitled design (8).png',
    columns: [
      { heading: 'Apparel', items: ['Men Wear', 'Women Wear', 'Kids Wear', 'Uniforms', 'Ethnic Wear'] },
      { heading: 'Arts & Crafts', items: ['Handicrafts', 'Decor', 'Gifts', 'Festive Items', 'DIY'] },
      { heading: 'Bags, Cases & Boxes', items: ['Travel Bags', 'Backpacks', 'Leather Goods', 'Packaging Boxes', 'Cases'] },
      { heading: 'Lights Industry', items: ['Toys', 'Stationery', 'Household Items', 'Cleaning', 'Pet Products'] },
    ],
  },
  {
    title: 'Consumer Goods & Electronics',
    image: '/images/categories/phone.png',
    columns: [
      { heading: 'Appliances', items: ['Kitchen Appliances', 'Home Appliances', 'Personal Care', 'Small Appliances', 'Parts'] },
      { heading: 'Computer Products', items: ['Laptops', 'Components', 'Storage', 'Networking', 'Accessories'] },
      { heading: 'Consumer Electronics', items: ['Mobiles', 'Audio', 'Smart Wearables', 'Cameras', 'Gaming'] },
      { heading: 'Office Supplies', items: ['Printers', 'Paper', 'Writing Instruments', 'Office Furniture', 'Supplies'] },
    ],
  },
  {
    title: 'Chemicals & Minerals',
    image: '/images/categories/chemical&rawmaterial.png',
    columns: [
      { heading: 'Chemicals', items: ['Industrial Chemicals', 'Dyes & Pigments', 'Adhesives', 'Additives', 'Solvents'] },
      { heading: 'Agriculture & Food', items: ['Fertilizers', 'Agro Chemicals', 'Food Additives', 'Feed', 'Seasonings'] },
      { heading: 'Packaging & Printing', items: ['Films', 'Bottles', 'Caps', 'Labels', 'Ink & Coatings'] },
      { heading: 'Minerals, Energy & Materials', items: ['Metals', 'Minerals', 'Coal & Energy', 'Non-metallic', 'Recyclables'] },
    ],
  },
];

function Categories() {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-semibold">All Categories</h1>
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-3 py-2 w-72"
              placeholder="Search categories or products..."
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Search</button>
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map((sec) => (
        <section key={sec.title} className="bg-white border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
            {/* Left Visual */}
            <div className="md:col-span-1 p-4 border-b md:border-b-0 md:border-r">
              <div className="h-40 w-full">
                <img
                  src={sec.image}
                  alt={sec.title}
                  className="w-full h-40 object-cover rounded"
                />
              </div>
                    <h2 className="mt-3 text-lg font-semibold break-words leading-snug">
          {sec.title}
        </h2>

            </div>

            {/* Columns */}
            <div className="md:col-span-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
                {sec.columns.map((col) => (
                  <div key={col.heading} className="p-4 border-t md:border-l">
                     <h3 className="font-semibold">{col.heading}</h3>
                    {/* <div className="flex items-center justify-between">
                      
                    </div> */}
                    <ul className="mt-2 text-sm text-gray-700 space-y-1">
                      {col.items.map((it) => (
                        <li key={it}>
                          <button 
                            onClick={() => navigate(`/products?category=${encodeURIComponent(it)}`)}
                            className="hover:text-blue-600 text-left"
                          >
                            {it}
                          </button>
                        </li>
                      ))}
                     
                      <button 
                        onClick={() => navigate(`/products?category=${encodeURIComponent(col.heading)}`)}
                        className="text-blue-600 text-sm"
                      >
                        More &gt;
                      </button>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Hot Searches */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Hot Searches</h3>
        <div className="flex flex-wrap gap-2">
          {[
            'CNC Machine', 'LED Lights', 'E-Bike', 'Power Tools', 'Packaging',
            'Mobile', 'Printer', 'Furniture', 'Textile', 'Food Additives',
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/products?category=${encodeURIComponent(tag)}`)}
              className="px-3 py-1.5 border rounded-full text-sm hover:border-blue-500 hover:text-blue-600"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ and Product Alert (CTA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold">Sourcing Request</h4>
          <p className="text-sm text-gray-600 mb-3">Post your request, get quotes from suppliers.</p>
          <Link to="/buyer/rfqs" className="px-4 py-2 bg-blue-600 text-white rounded inline-block">
            Post RFQ
          </Link>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold">Product Alert</h4>
          <p className="text-sm text-gray-600 mb-3">Get notified when new products are added.</p>
          <Link to="#" className="px-4 py-2 bg-green-600 text-white rounded inline-block">
            Create Alert
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Categories;