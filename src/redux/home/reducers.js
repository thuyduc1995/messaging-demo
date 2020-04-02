import { toRequest, toSuccess } from "utils/actionUtils";
import { TYPES } from './actions'

const initialState = {
  todos: [],
  isLoading: false
};

export default function homeReducers(state = initialState, action) {
  switch (action.type) {
    case toRequest(TYPES.FETCH_TODOS):
      return {
        ...state,
        isLoading: true
      };
    case toSuccess(TYPES.FETCH_TODOS):
      return {
        ...state,
        isLoading: false,
        todos: action.payload.todos
      };
    case TYPES.ADD_TODO:
      const currentTodos = [...state.todos];
      currentTodos.push({ content: action.payload, isCompleted: false });
      return {
        ...state,
        todos: currentTodos
      };
    default:
      return state
  }
}
