import React from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";

const List = ({ data }) => {
  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <Box p={2} sx={{ height: "calc(100vh - 199px)", overflowY: "auto" }}>
      {data.map((item) => (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            pb={1}
          >
            <Typography
              varaint="button"
              color={item.meta.color}
              fontWeight={500}
            >
              {item.meta.name}
              {/* fullname */}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            sx={{
              display: "flex",
              justifyContent: "left",
              flexWrap: "wrap",
              listStyle: "none",
              p: 0.5,
              m: 0,
            }}
          >
            {item.instances.map((i) => (
              <Chip
                label={`${i.surface_form} (${i.count})`}
                // clickable
                size="small"
                variant="outlined"
                sx={{
                  margin: "4px",
                  borderColor: item.meta.color,
                  color: item.meta.color,
                }}
                title={`"${i.surface_form}" has been tagged ${i.count} time${
                  i.count > 1 ? "s" : ""
                } with the class "${item.meta.fullname}"`}
              />
            ))}
          </Stack>
        </>
      ))}
    </Box>
  );
};

export default List;
