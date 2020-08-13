/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import { useState } from 'react';

const useForm = (initialValues, callback) => {
  const [inputs, setInputs] = useState(initialValues);
  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    callback();
  }



  const handleInputChange = (event, typeOfInput) => {

    if (typeof event.persist === "function") {
      event.persist();
    }
    if (typeOfInput === "isNumber") {
      const regex = /^[a-zA-Z!”$%&’()*\+,\/;\[\\\]\^_`"{|}^~'{}<>:?/,-]+$/;
      var text = event.target.value
      var avoidAlphabets = text.replace(regex, "")
      setInputs(inputs => ({ ...inputs, [event.target.name]: avoidAlphabets }));
    }
    else if (typeOfInput === "notEqualToZero") {
      var text = event.target.value
      if (text === "00" || text === "0") {
        var avoidHtmlTags = text.replace("")
        setInputs(inputs => ({ ...inputs, [event.target.name]: '' }));
      }
      else if (text === "-") {
        var avoidHtmlTags = text.replace("")
        setInputs(inputs => ({ ...inputs, [event.target.name]: '' }));
      }
      else {
        setInputs(inputs => ({ ...inputs, [event.target.name]: event.target.value }));
      }
    }
    else if (typeOfInput === "inputTextArea") {
      var regex = /(<([^>]+)>)/ig;
      var text = event.target.value
      var avoidHtmlTags = text.replace(regex, "")
      setInputs(inputs => ({ ...inputs, [event.target.name]: avoidHtmlTags }));
    } else if (event.target.extra) {
      setInputs(inputs => ({ ...inputs, [event.target.name]: { name: event.target.extra.name, id: event.target.value } }));
    }
    else {
      setInputs(inputs => ({ ...inputs, [event.target.name]: event.target.value }));
    }
  }

  //common function for clearing states.
  const resetState = (clearState) => {
    setInputs(inputs => ({
      ...inputs,
      ...clearState
    }))
  }

  return {
    handleSubmit,
    handleInputChange,
    inputs,
    setInputs,
    resetState
  };
}
export default useForm;