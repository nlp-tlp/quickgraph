import { useState } from "react";
import axiosInstance from "../../utils/api";

const useSocial = ({ state, dispatch }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [data, setData] = useState([]);
  const [message, setMessage] = useState({
    open: false,
    severity: null,
    title: null,
    message: null,
  });

  const handleMessageClose = () =>
    setMessage((prevState) => ({
      ...prevState,
      open: false,
    }));

  const postComment = async ({ text, context, datasetItemId }) => {
    try {
      setSubmitting(true);
      setError(false);

      const response = await axiosInstance.post(`/social/${datasetItemId}`, {
        text,
        context,
        dataset_item_id: datasetItemId,
      });

      dispatch({
        type: "SET_VALUE",
        payload: {
          social: {
            ...state.social,
            [datasetItemId]: [...state.social[datasetItemId], response.data],
          },
        },
      });
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to post comment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async ({ datasetItemId, commentId }) => {
    try {
      setDeleting(true);
      setError(false);

      await axiosInstance.delete(`/social/${commentId}`);

      dispatch({
        type: "SET_VALUE",
        payload: {
          social: {
            ...state.social,
            [datasetItemId]: state.social[datasetItemId].filter(
              (c) => c._id !== commentId
            ),
          },
        },
      });
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to delete comment",
      });
    } finally {
      setDeleting(false);
    }
  };

  const fetchComments = async ({ datasetItemId, context }) => {
    try {
      setLoading(true);
      setError(false);

      const response = await axiosInstance.get(`/social/${datasetItemId}`, {
        params: { context },
      });

      setData(response.data);
    } catch (err) {
      setError(true);
      setMessage({
        open: true,
        severity: "error",
        title: "Error",
        message: "Failed to fetch comments",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    submitting,
    data,
    postComment,
    fetchComments,
    deleteComment,
    message,
    handleMessageClose,
    deleting,
  };
};

export default useSocial;
