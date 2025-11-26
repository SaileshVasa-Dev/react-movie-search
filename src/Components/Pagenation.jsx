import React from "react";

function Pagenation({ handlePrev, handleNext, pageNo }) {
  return (
    <div
      className="h-12 backdrop-blur-xl bg-white/10 border border-white/10 
                rounded-xl mx-4 md:mx-32 mt-6 flex justify-center 
                items-center gap-6 shadow-xl"
    >
      <button onClick={handlePrev} className="px-8 hover:cursor-pointer">
        <i className="fa-regular fa-circle-left text-gray-300"></i>
      </button>
      <div className="font-bold hover:cursor-pointer text-gray-200 ">
        {pageNo}
      </div>
      <button onClick={handleNext} className="px-8 hover:cursor-pointer">
        <i className="fa-regular fa-circle-right text-gray-300"></i>
      </button>
    </div>
  );
}

export default React.memo(Pagenation);
