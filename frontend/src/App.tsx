import React from "react";
import "./App.css";
import InvestmentCalculator from "./components/InvestmentCalculator";

function App() {
  return (
    <div className="App">
      <InvestmentCalculator />
      
      {/* Professional Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Investment Time Machine
              </h3>
              <p className="text-gray-400 text-sm">Professional investment analysis</p>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Market data provided by Yahoo Finance</p>
              <p>© 2024 Investment Time Machine. All rights reserved.</p>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 max-w-4xl mx-auto leading-relaxed">
              <strong className="text-gray-400">Disclaimer:</strong> This tool is for educational and informational purposes only. 
              Past performance does not guarantee future results. All investments carry risk and may result in loss of principal. 
              Please consult with a qualified financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
