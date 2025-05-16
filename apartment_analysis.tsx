import { useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function ApartmentAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("rent");
  const [showDetails, setShowDetails] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const fileData = await window.fs.readFile("Apartment rentals for Ryan T.csv", { encoding: "utf8" });
        
        // Parse CSV data
        const Papa = await import("papaparse");
        const result = Papa.parse(fileData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: h => h.trim()
        });
        
        // Clean and process data
        const processedData = result.data
          .filter(row => row["Name/Complex"] && row["Monthly Rent"] && row["Commute time in min"])
          .map(row => {
            // Extract rent as a number
            let rent = row["Monthly Rent"];
            if (typeof rent === "string") {
              rent = parseFloat(rent.replace(/[~$,]/g, ""));
            }
            
            return {
              name: row["Name/Complex"],
              location: row["Location"],
              rent: rent || 0,
              commute: row["Commute time in min"] || 0,
              bedrooms: row["Bedrooms"] || 0,
              bathrooms: row["Bathrooms"] || 0,
              sqft: row["Sqaure Feet"] || 0,
              link: row["Link"],
              rentPerSqft: row["Sqaure Feet"] ? (rent / row["Sqaure Feet"]).toFixed(2) : "N/A"
            };
          })
          .filter(row => !isNaN(row.rent) && !isNaN(row.commute));
        
        setData(processedData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const sortData = (dataToSort, sortKey) => {
    return [...dataToSort].sort((a, b) => {
      if (sortKey === "value") {
        // Sort by value score (lower rent and commute time is better)
        const aValue = (a.rent / 1000) + (a.commute / 15);
        const bValue = (b.rent / 1000) + (b.commute / 15);
        return aValue - bValue;
      }
      return a[sortKey] - b[sortKey];
    });
  };

  const handleSort = (key) => {
    setSortBy(key);
  };

  const sortedData = sortData(data, sortBy);
  
  // Calculate color based on value (lower is better)
  const getValueScore = (item) => {
    return (item.rent / 1000) + (item.commute / 15);
  };
  
  const getScoreColor = (score) => {
    // Lower scores are better (green), higher scores are worse (red)
    const minScore = Math.min(...data.map(getValueScore));
    const maxScore = Math.max(...data.map(getValueScore));
    const range = maxScore - minScore;
    
    // Normalize score to 0-1 range
    const normalized = (score - minScore) / range;
    
    // Color from green (good) to red (bad)
    const r = Math.round(normalized * 255);
    const g = Math.round((1 - normalized) * 255);
    const b = 0;
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  if (loading) {
    return <div className="p-4">Loading apartment data...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Apartment Rental Analysis</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Rent vs. Commute Time Comparison</h3>
        <div className="mb-2">
          <span className="text-sm text-gray-500">Each point represents an apartment. The best options are in the bottom-left corner (low rent, short commute).</span>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid />
            <XAxis 
              type="number" 
              dataKey="commute" 
              name="Commute Time" 
              label={{ value: 'Commute Time (minutes)', position: 'bottom', offset: 0 }}
            />
            <YAxis 
              type="number" 
              dataKey="rent" 
              name="Monthly Rent" 
              label={{ value: 'Monthly Rent ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name) => {
                if (name === "rent") return [`$${value}`, "Monthly Rent"];
                if (name === "commute") return [`${value} min`, "Commute Time"];
                return [value, name];
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const apartment = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border border-gray-300 shadow-md">
                      <p className="font-bold">{apartment.name}</p>
                      <p>Monthly Rent: ${apartment.rent}</p>
                      <p>Commute Time: {apartment.commute} min</p>
                      <p>Bedrooms: {apartment.bedrooms}</p>
                      <p>Square Feet: {apartment.sqft}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter 
              name="Apartments" 
              data={data} 
              fill="#8884d8"
              shape={(props) => {
                const { cx, cy } = props;
                const item = props.payload;
                const valueScore = getValueScore(item);
                const color = getScoreColor(valueScore);
                
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={7} 
                    fill={color}
                    stroke="#000"
                    strokeWidth={1}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Best Value Options</h3>
        <p className="text-sm text-gray-500 mb-2">
          Sort by: 
          <button 
            className={`ml-2 px-2 py-1 ${sortBy === "rent" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => handleSort("rent")}
          >
            Rent
          </button>
          <button 
            className={`ml-2 px-2 py-1 ${sortBy === "commute" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => handleSort("commute")}
          >
            Commute
          </button>
          <button 
            className={`ml-2 px-2 py-1 ${sortBy === "value" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => handleSort("value")}
          >
            Best Value
          </button>
        </p>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={sortedData.slice(0, 10)}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={140}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "rent") return [`$${value}`, "Monthly Rent"];
                if (name === "commute") return [`${value} min`, "Commute Time"];
                return [value, name];
              }}
            />
            <Legend />
            <Bar 
              dataKey="rent" 
              name="Monthly Rent ($)" 
              fill="#8884d8" 
              barSize={20}
            />
            <Bar 
              dataKey="commute" 
              name="Commute Time (min)" 
              fill="#82ca9d" 
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Top 10 Best Value Apartments</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Location</th>
                <th className="px-4 py-2 border">Monthly Rent</th>
                <th className="px-4 py-2 border">Commute (min)</th>
                <th className="px-4 py-2 border">Bed/Bath</th>
                <th className="px-4 py-2 border">Sq Ft</th>
                <th className="px-4 py-2 border">$/Sq Ft</th>
                <th className="px-4 py-2 border">Details</th>
              </tr>
            </thead>
            <tbody>
              {sortData(data, "value").slice(0, 10).map((apt, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-2 border">{apt.name}</td>
                  <td className="px-4 py-2 border text-sm">{apt.location}</td>
                  <td className="px-4 py-2 border">${apt.rent}</td>
                  <td className="px-4 py-2 border">{apt.commute}</td>
                  <td className="px-4 py-2 border">{apt.bedrooms}/{apt.bathrooms}</td>
                  <td className="px-4 py-2 border">{apt.sqft}</td>
                  <td className="px-4 py-2 border">{apt.rentPerSqft}</td>
                  <td className="px-4 py-2 border">
                    <button 
                      className="px-2 py-1 bg-blue-500 text-white text-sm rounded"
                      onClick={() => setShowDetails(showDetails === index ? null : index)}
                    >
                      {showDetails === index ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {showDetails !== null && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h4 className="font-bold text-lg">{sortData(data, "value")[showDetails].name}</h4>
          <p className="mb-1">Location: {sortData(data, "value")[showDetails].location}</p>
          <p className="mb-1">Monthly Rent: ${sortData(data, "value")[showDetails].rent}</p>
          <p className="mb-1">Commute Time: {sortData(data, "value")[showDetails].commute} minutes</p>
          <p className="mb-1">Bedrooms: {sortData(data, "value")[showDetails].bedrooms}</p>
          <p className="mb-1">Bathrooms: {sortData(data, "value")[showDetails].bathrooms}</p>
          <p className="mb-1">Square Feet: {sortData(data, "value")[showDetails].sqft}</p>
          <p className="mb-1">Price per Sq Ft: ${sortData(data, "value")[showDetails].rentPerSqft}</p>
          {sortData(data, "value")[showDetails].link && (
            <p className="mt-2">
              <a 
                href={sortData(data, "value")[showDetails].link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                View Listing
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}