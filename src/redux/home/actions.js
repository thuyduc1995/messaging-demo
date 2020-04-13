import { createAsyncActions, createAction } from "utils/actionUtils";

const TYPES = {
  FETCH_TODOS: 'FETCH_TODOS',
  ADD_TODO: 'ADD_TODO'
};

const fetchTodos = () =>
  createAsyncActions({
    type: TYPES.FETCH_TODOS,
    payload: {
      url: '/todos',
      params: {
        id: '1'
      },
      body: {
        content: 123
      }
    }
  });

const addTodo = (value) =>
  createAction({
    type: TYPES.ADD_TODO,
    payload: value
  });

const login = (username) =>
  createAction({
    type: 'LOGIN',
    payload: username
  });


export default {
  fetchTodos,
  addTodo,
  login
}

export { TYPES, fetchTodos }
