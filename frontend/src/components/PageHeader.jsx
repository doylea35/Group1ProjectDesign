import React from "react";
import "../App.css"; 

export default function PageHeader({ title }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
    </div>
  );
}
