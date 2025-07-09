import React from "react";
import "./App.css";
import InvestmentCalculator from "./components/InvestmentCalculator";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            If You Invested...
          </h1>
          <p className="text-lg text-gray-600">
            Calculate what your stock investment would be worth today
          </p>
        </header>

        <InvestmentCalculator />

        <footer className="text-center mt-12 text-gray-500">
          <p>Stock data provided by Yahoo Finance</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
