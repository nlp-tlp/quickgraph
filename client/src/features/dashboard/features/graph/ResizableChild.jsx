import React, { useState, useEffect, useRef } from "react";

function ResizableChild(props) {
  const [parentSize, setParentSize] = useState({ width: 0, height: 0 });
  const childRef = useRef(null);

  useEffect(() => {
    // Get the size of the parent component on mount
    setParentSize({
      width: childRef.current.parentElement.clientWidth,
      height: childRef.current.parentElement.clientHeight,
    });

    // Update the size of the parent component on window resize
    function handleResize() {
      setParentSize({
        width: childRef.current.parentElement.clientWidth,
        height: childRef.current.parentElement.clientHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update the child component's width and height based on the parent's size
  const { width, height } = parentSize;
  const childWidth = width * props.widthRatio;
  const childHeight = height * props.heightRatio;

  return (
    <div
      ref={childRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {React.cloneElement(props.children, {
        style: { position: "absolute", width: childWidth, height: childHeight },
      })}
    </div>
  );
}

export default ResizableChild;
