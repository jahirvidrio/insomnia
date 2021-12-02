import { ipcRenderer } from 'electron';

import type { GrpcRequestEvent } from '../../../common/ipc-events';
import { GrpcResponseEventEnum } from '../../../common/ipc-events';
import type { GrpcDispatch } from './grpc-actions';
import { grpcActions } from './grpc-actions';

const listenForStart = (dispatch: GrpcDispatch) => {
  ipcRenderer.on(GrpcResponseEventEnum.start, (_, requestId) => {
    dispatch(grpcActions.start(requestId));
  });
};

const listenForStop = (dispatch: GrpcDispatch) => {
  ipcRenderer.on(GrpcResponseEventEnum.end, (_, requestId) => {
    dispatch(grpcActions.stop(requestId));
  });
};

const listenForData = (dispatch: GrpcDispatch) => {
  ipcRenderer.on(GrpcResponseEventEnum.data, (_, requestId, val) => {
    dispatch(grpcActions.responseMessage(requestId, val));
  });
};

const listenForError = (dispatch: GrpcDispatch) => {
  ipcRenderer.on(GrpcResponseEventEnum.error, (_, requestId, err) => {
    dispatch(grpcActions.error(requestId, err));
  });
};

const listenForStatus = (dispatch: GrpcDispatch) => {
  ipcRenderer.on(GrpcResponseEventEnum.status, (_, requestId, status) => {
    dispatch(grpcActions.status(requestId, status));
  });
};

const init = (dispatch: GrpcDispatch): void => {
  listenForStart(dispatch);
  listenForStop(dispatch);
  listenForData(dispatch);
  listenForError(dispatch);
  listenForStatus(dispatch);
};

const destroy = (): void => {
  ipcRenderer.removeAllListeners(GrpcResponseEventEnum.start);
  ipcRenderer.removeAllListeners(GrpcResponseEventEnum.end);
  ipcRenderer.removeAllListeners(GrpcResponseEventEnum.data);
  ipcRenderer.removeAllListeners(GrpcResponseEventEnum.error);
  ipcRenderer.removeAllListeners(GrpcResponseEventEnum.status);
};

export const grpcIpcRenderer = {
  init,
  destroy,
};
export const sendGrpcIpcMultiple = (channel: GrpcRequestEvent, requestIds?: string[]) => {
  if (requestIds?.length) {
    ipcRenderer.send(channel, requestIds);
  }
};
