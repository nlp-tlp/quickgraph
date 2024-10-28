import { useState } from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Link } from "react-router-dom";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const ListItemWithChildren = ({ menuOpen, index, item, location }) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  if (!menuOpen) {
    return (
      <Tooltip title={item.title} placement="right">
        <ListItem
          disablePadding
          key={`primary-menu-item-${index}`}
          title={item.title}
        >
          <ListItemButton
            component={Link}
            to={item.href}
            selected={location.pathname.startsWith(item.href)}
            sx={{
              minHeight: 48,
              justifyContent: "center",
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: "center",
                mr: 0,
              }}
            >
              {item.icon}
            </ListItemIcon>
          </ListItemButton>
        </ListItem>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip title={item.title} placement="right">
        <ListItem
          disablePadding
          key={`primary-menu-item-${index}`}
          secondaryAction={
            <IconButton>
              {open ? (
                <ExpandLess onClick={handleClick} />
              ) : (
                <ExpandMore onClick={handleClick} />
              )}
            </IconButton>
          }
        >
          <ListItemButton
            component={Link}
            to={item.href}
            selected={location.pathname.startsWith(item.href)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItemButton>
        </ListItem>
      </Tooltip>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List
          component="div"
          disablePadding
          key={`primary-menu-item-${index}-children`}
        >
          {item.children.map((child, childIndex) => (
            <ListItem
              disablePadding
              key={`primary-menu-item-${index}-${childIndex}`}
            >
              <ListItemButton
                sx={{ pl: 4 }}
                component={Link}
                to={child.href}
                selected={location.pathname.startsWith(item.href)}
              >
                <ListItemIcon>{child.icon}</ListItemIcon>
                <ListItemText primary={child.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
};

export default ListItemWithChildren;
