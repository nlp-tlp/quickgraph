import React, { useState, useEffect } from "react";
import Graph from "react-graph-vis";

const options = {
  // layout: {
  //   hierarchical: false,
  // },
  // edges: {
  //   color: "#000000",
  // },
  nodes: {
    shape: "dot",
    scaling: {
      customScalingFunction: function (min, max, total, value) {
        return value / total;
      },
      min: 5,
      max: 150,
    },
  },
};

export const Dev = () => {
  const [state, setState] = useState({
    counter: 5,
    graph: {
      nodes: [
        { id: 1, value: 1, label: "motor", color: "#e04141" },
        { id: 2, value: 5, label: "Change out", color: "#e09c41" },
        { id: 3, value: 4, label: "leaking", color: "#e0df41" },
        { id: 4, value: 1, label: "oil", color: "#7be041" },
        { id: 5, value: 2, label: "coolant", color: "#41e0c9" },
      ],
      edges: [
        { from: 1, to: 2, value: 2 },
        { from: 1, to: 3, value: 1 },
        { from: 2, to: 4, value: 2 },
        { from: 2, to: 5, value: 1 },
      ],
    },
    // events: {
    //   select: ({ nodes, edges }) => {
    //     console.log("Selected nodes:");
    //     console.log(nodes);
    //     console.log("Selected edges:");
    //     console.log(edges);
    //     alert("Selected node: " + nodes);
    //   },
    // },
  });
  const { graph, events } = state;

  return (
    <div>
      {/* <Graph
      graph={graph}
      options={options}
      events={events}
      style={{ height: "640px" }}
      /> */}
    </div>
  );
};

// export const Dev = () => {
//   const [arrow, setArrow] = useState();

//   const getBoxToBoxArrow = (source, target, props) => {
//     const { strokeWidth, lineOffset } = props;

//     const l1_length = Math.abs(source.y - target.y) + lineOffset;
//     console.log(l1_length);
//     console.log(source.y - l1_length);

//     const l1 = `M${source.x + source.width / 2} ${source.y} L${
//       source.x + source.width / 2
//     } ${source.y - l1_length}`; // |

//     const l2 = `M${source.x + source.width / 2 - strokeWidth / 2} ${
//       source.y - l1_length
//     } L${target.x + target.width / 2 + strokeWidth / 2} ${
//       source.y - l1_length
//     }`; // -

//     const l3 = `M${target.x + target.width / 2} ${source.y - l1_length} L${
//       target.x + target.width / 2
//     } ${target.y}`; // |

//     // arrow tip

//     return { l1, l2, l3 };
//   };

//   const drawArrow = () => {
//     console.log("hello");

//     const sourceData = document.getElementById("word1").getBoundingClientRect();
//     const targetData = document.getElementById("word2").getBoundingClientRect();

//     console.log("word1", sourceData);
//     console.log("word2", targetData);

//     setArrow(
//       getBoxToBoxArrow(sourceData, targetData, {
//         strokeWidth: 2,
//         lineOffset: 20,
//       })
//     );

//     console.log(arrow);
//   };
//   const strokeWidth = 2;

//   const words = ["hello", "world"];

//   return (
//     <>
//       <div style={{ display: "flex" }}>
//         {words.map((word, index) => {
//           return (
//             <div
//               id={`word${index + 1}`}
//               style={{
//                 position: "absolute",
//                 top: "100px",
//                 left: `${(index + 1) * 100}px`,
//                 height: "50px",
//                 width: "100px",
//                 border: "2px solid grey",
//                 textAlign: "center",
//                 padding: "10px",
//               }}
//             >
//               {word}
//             </div>
//           );
//         })}
//       </div>
//       <svg
//         viewBox="0 0 1280 720"
//         style={{ width: 1280, height: 720 }}
//         stroke="#000"
//         fill="#000"
//         strokeWidth={3}
//       >
//         {arrow && (
//           <>
//             <path
//               d={arrow.l1}
//               strokeWidth={strokeWidth}
//               onClick={() => console.log("hello there")}
//             />
//             <path
//               d={arrow.l2} //{`M${50 - strokeWidth / 2} 25 L${200 + strokeWidth / 2} 25`}
//               strokeWidth={strokeWidth}
//             />
//             <path
//               d={arrow.l3} //{`M200 25 L200 50`}
//               strokeWidth={strokeWidth}
//             />

//             {/* <path
//             d={`M${arrow.sx},${arrow.sy} Q${arrow.cx},${arrow.cy} ${arrow.ex},${arrow.ey}`}
//             fill="none"
//           /> */}
//           </>
//         )}
//       </svg>
//       <button onClick={() => drawArrow()}>Draw Arrow</button>
//     </>
//   );
// };
