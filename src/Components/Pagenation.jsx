import React from "react";

function Pagenation({ handlePrev, handleNext, pageNo }) {
  return (
    <div className="bg-gray-400 p-4 mt-8 flex justify-center rounded-lg">
      <button onClick={handlePrev} className="px-8 hover:cursor-pointer">
        <i className="fa-regular fa-circle-left"></i>
      </button>
      <div className="font-bold hover:cursor-pointer">{pageNo}</div>
      <button onClick={handleNext} className="px-8 hover:cursor-pointer">
        <i className="fa-regular fa-circle-right"></i>
      </button>
    </div>
  );
}

export default React.memo(Pagenation);
