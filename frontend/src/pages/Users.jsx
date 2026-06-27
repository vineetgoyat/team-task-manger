import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/users").then(r => setUsers(r.data)).catch(() => toast.error("Failed to load users"));
  }, []);
