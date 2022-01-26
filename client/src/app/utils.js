export const setToastInfo = (applyAll, action) => {

    const toastInfo = () => {

        return {action: action, applyAll: applyAll}
    }

  switch (applyAll) {
    case true:
        return toastInfo()
    case false:
      break;
    default:
      break;
  }
};
