export const progressData = [
  {
    x: "03/03/2023",
    y: "tyler-research",
    value: 0,
  },
  {
    x: "03/03/2023",
    y: "dummy-user",
    value: 235,
  },
];

export const entityData = [
  ...Array(10)
    .fill()
    .map((_, idx) => `user-${idx}`),
].flatMap((username) => [
  ...Array(50)
    .fill()
    .map((_, index) => ({
      x: `Human-${index}`,
      y: username,
      value: Math.floor(Math.random() * 2500),
    })),
]);
