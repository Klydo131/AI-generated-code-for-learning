import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { useEffect } from "react";
import Papa from "papaparse";

export default function RentalAnalysis() {
  const [rentalData, setRentalData] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [sortBy, setSortBy] = useState("rent"); // Default sort by rent
  const [showTable, setShowTable] = useState(true);
  const [topCount, setTopCount] = useState(5);
  const [filterCommute, setFilterCommute] = useState(0);
  const [maxCommute, setMaxCommute] = useState(60);
  const [maxRent, setMaxRent] = useState(3000);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await window.fs.readFile('Apartment rentals for Ryan T.csv', { encoding: 'utf8' });
        
        Papa.parse(result, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            // Clean and transform the data
            const cleanedData = results.data
              .filter(row => row["Name/Complex"] && row["Monthly Rent"])
              .map(row => {
                // Extract numeric rent value
                let rent = row["Monthly Rent"];
                if (typeof rent === "string") {
                  rent = parseFloat(rent.replace(/[~$,]/g, ""));
                }
                
                // Ensure commute time is a number
                let commute = row["Commute time in min"];
                if (typeof commute === "string") {
                  commute = parseFloat(commute);
                }
                
                // Ensure bedrooms is a number
                let bedrooms = row["Bedrooms"];
                if (typeof bedrooms === "string") {
                  bedrooms = parseFloat(bedrooms);
                }
                
                return {
                  name: row["Name/Complex"],
                  location: row["Location"],
                  rent: rent || 0,
                  commute: commute || 0,
                  bedrooms: bedrooms || 0,
                  bathrooms: row["Bathrooms"] || 0,
                  sqft: row["Sqaure Feet"] || 0,
                  link: row["Link"],
                  efficiency: commute > 0 ? rent / commute : rent, // Rent-to-commute ratio
                };
              })
              .filter(row => !isNaN(row.rent) && !isNaN(row.commute));
              
            setRentalData(cleanedData);
            
            // Set max values for filters
            const maxCommuteTime = Math.max(...cleanedData.map(item => item.commute));
            const maxRentAmount = Math.max(...cleanedData.map(item => item.rent));
            setMaxCommute(maxCommuteTime);
            setMaxRent(Math.ceil(maxRentAmount / 500) * 500); // Round up to nearest 500
          }
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    loadData();
  }, []);

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
  };

  const filteredData = rentalData
    .filter(item => item.commute <= filterCommute || filterCommute === 0)
    .filter(item => item.rent <= maxRent)
    .sort((a, b) => {
      if (sortBy === "rent") return a.rent - b.rent;
      if (sortBy === "commute") return a.commute - b.commute;
      if (sortBy === "efficiency") return a.efficiency - b.efficiency;
      if (sortBy === "pricePerSqft") return (a.rent / a.sqft) - (b.rent / b.sqft);
      return 0;
    });

  const topProperties = filteredData.slice(0, topCount);
  
  // For bar chart comparison
  const barChartData = topProperties.map(property => ({
    name: property.name.length > 15 ? property.name.substring(0, 15) + '...' : property.name,
    rent: property.rent,
    commute: property.commute,
  }));

  // Calculate the "value score" - lower is better
  // This combines rent and commute time into a single score
  const valueScore = (rent, commute) => {
    // Normalize both values to 0-1 scale
    const maxRentInData = Math.max(...rentalData.map(p => p.rent));
    const maxCommuteInData = Math.max(...rentalData.map(p => p.commute));
    
    const normalizedRent = rent / maxRentInData;
    const normalizedCommute = commute / maxCommuteInData;
    
    // Lower values are better, weight rent slightly more than commute
    return (normalizedRent * 0.6) + (normalizedCommute * 0.4);
  };

  return (
    <div className="p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-4">Apartment Rental Analysis</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Filters & Sorting</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 p-2"
              >
                <option value="rent">Lowest Rent</option>
                <option value="commute">Shortest Commute</option>
                <option value="efficiency">Best Value (Rent/Commute)</option>
                <option value="pricePerSqft">Price per Sq Ft</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Top properties:</label>
              <select
                value={topCount}
                onChange={(e) => setTopCount(parseInt(e.target.value))}
                className="mt-1 block w-full rounded border border-gray-300 p-2"
              >
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="15">Top 15</option>
                <option value="30">All</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max commute time: {filterCommute > 0 ? filterCommute : "No limit"} min
              </label>
              <input
                type="range"
                min="0"
                max={maxCommute}
                value={filterCommute}
                onChange={(e) => setFilterCommute(parseInt(e.target.value))}
                className="mt-1 block w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max rent: ${maxRent}
              </label>
              <input
                type="range"
                min="1000"
                max="3000"
                step="100"
                value={maxRent}
                onChange={(e) => setMaxRent(parseInt(e.target.value))}
                className="mt-1 block w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Best Value Properties</h2>
          <div className="bg-blue-50 p-4 rounded">
            {filteredData.length > 0 ? (
              <>
                <p className="font-medium">Based on your criteria, these are the top recommendations:</p>
                <ol className="mt-2 list-decimal list-inside">
                  {topProperties.slice(0, 3).map((property, index) => (
                    <li key={index} className="mb-1">
                      <span className="font-medium">{property.name}</span> - 
                      ${property.rent}/month, {property.commute} min commute,
                      {property.bedrooms} bed/{property.bathrooms} bath
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p>No properties match your current filters.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Rent vs. Commute Time</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="commute" 
                name="Commute Time" 
                unit=" min"
                domain={[0, 'dataMax']}
                label={{ value: 'Commute Time (minutes)', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                type="number" 
                dataKey="rent" 
                name="Monthly Rent" 
                unit="$"
                domain={[0, 'dataMax']}
                label={{ value: 'Monthly Rent ($)', angle: -90, position: 'left' }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "Monthly Rent") return [`$${value}`, name];
                  return [`${value} min`, name];
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow-sm">
                        <p className="font-bold">{data.name}</p>
                        <p>Monthly Rent: ${data.rent}</p>
                        <p>Commute Time: {data.commute} min</p>
                        <p>{data.bedrooms} bed / {data.bathrooms} bath</p>
                        <p>{data.sqft} sq ft</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Properties" data={rentalData}>
                {rentalData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={selectedProperty && selectedProperty.name === entry.name ? "#ff6b6b" : "#8884d8"}
                    onClick={() => handlePropertyClick(entry)}
                    cursor="pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Click on any point to see property details. Ideal properties are in the bottom-left (low rent, short commute).
        </p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Top {topCount} Properties Comparison</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Bar yAxisId="left" dataKey="rent" name="Monthly Rent ($)" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="commute" name="Commute Time (min)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Property Details</h2>
          <button 
            onClick={() => setShowTable(!showTable)} 
            className="text-blue-600 hover:text-blue-800"
          >
            {showTable ? "Hide Table" : "Show Table"}
          </button>
        </div>
        
        {showTable && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Property</th>
                  <th className="p-2 text-left">Location</th>
                  <th className="p-2 text-right">Rent</th>
                  <th className="p-2 text-right">Commute</th>
                  <th className="p-2 text-center">Bed/Bath</th>
                  <th className="p-2 text-right">Sq Ft</th>
                  <th className="p-2 text-right">$/Sq Ft</th>
                  <th className="p-2 text-center">Value Score</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.map((property, index) => (
                  <tr 
                    key={index}
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} 
                      ${selectedProperty && selectedProperty.name === property.name ? 'bg-blue-100' : ''}`}
                    onClick={() => handlePropertyClick(property)}
                  >
                    <td className="p-2 font-medium">{property.name}</td>
                    <td className="p-2 text-sm">{property.location}</td>
                    <td className="p-2 text-right">${property.rent.toFixed(0)}</td>
                    <td className="p-2 text-right">{property.commute} min</td>
                    <td className="p-2 text-center">{property.bedrooms}/{property.bathrooms}</td>
                    <td className="p-2 text-right">{property.sqft}</td>
                    <td className="p-2 text-right">
                      ${property.sqft ? (property.rent / property.sqft).toFixed(2) : "N/A"}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center items-center">
                        <div 
                          className="h-4 bg-gradient-to-r from-green-500 to-red-500 rounded-full w-24"
                          style={{
                            background: `linear-gradient(90deg, #22c55e 0%, #ef4444 100%)`,
                            position: 'relative'
                          }}
                        >
                          <div 
                            className="absolute w-3 h-3 bg-blue-800 rounded-full -mt-0.5 transform -translate-x-1/2"
                            style={{ 
                              left: `${valueScore(property.rent, property.commute) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {selectedProperty && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="text-lg font-semibold">{selectedProperty.name}</h3>
            <p>{selectedProperty.location}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div>
                <p><span className="font-medium">Monthly Rent:</span> ${selectedProperty.rent}</p>
                <p><span className="font-medium">Commute Time:</span> {selectedProperty.commute} minutes</p>
                <p><span className="font-medium">Size:</span> {selectedProperty.sqft} sq ft</p>
              </div>
              <div>
                <p><span className="font-medium">Bedrooms:</span> {selectedProperty.bedrooms}</p>
                <p><span className="font-medium">Bathrooms:</span> {selectedProperty.bathrooms}</p>
                <p>
                  <span className="font-medium">Price per sq ft:</span> 
                  ${selectedProperty.sqft ? (selectedProperty.rent / selectedProperty.sqft).toFixed(2) : "N/A"}
                </p>
              </div>
            </div>
            {selectedProperty.link && (
              <a 
                href={selectedProperty.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block mt-2 text-blue-600 hover:underline"
              >
                View Listing →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
