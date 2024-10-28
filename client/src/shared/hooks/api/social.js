import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axiosInstance from "../../utils/api";

const useSocial = ({ state, dispatch }) => {
  const { getAccessTokenSilently } = useAuth0();
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
    getAccessTokenSilently().then((token) => {
      setSubmitting(true);
      setError(false);
      axiosInstance
        .post(
          `/social/${datasetItemId}`,
          { text: text, context: context, dataset_item_id: datasetItemId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((res) => {
          dispatch({
            type: "SET_VALUE",
            payload: {
              social: {
                ...state.social,
                [datasetItemId]: [...state.social[datasetItemId], res.data],
              },
            },
          });
        })
        .catch(() => setError(true))
        .finally(() => setSubmitting(false));
    });
  };

  const deleteComment = async ({ datasetItemId, commentId }) => {
    getAccessTokenSilently().then((token) => {
      setDeleting(true);
      setError(false);
      axiosInstance
        .delete(`/social/${commentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(() => {
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
        })
        .catch(() => setError(true))
        .finally(() => setDeleting(false));
    });
  };

  // const fetchComments = async ({ datasetItemId, context }) => {
  //   getAccessTokenSilently().then((token) => {
  //     setLoading(true);
  //     setError(false);
  //     axiosInstance
  //       .get(`/social/${datasetItemId}`, {
  //         params: { context: context },
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       })
  //       .then((res) => {
  //         setData(res.data);
  //       })
  //       .catch(() => setError(true))
  //       .finally(() => setLoading(false));
  //   });
  // };

  return {
    loading,
    error,
    submitting,
    data,
    postComment,
    // fetchComments,
    deleteComment,
    message,
    handleMessageClose,
    deleting,
  };
};

export default useSocial;
