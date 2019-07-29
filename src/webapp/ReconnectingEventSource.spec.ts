import { describe, it } from 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';
import ReconnectingEventSource from './ReconnectingEventSource';
import EventSourceMock, { sources } from './EventSourceMock';
import { EventType } from '../common/IEvent';

const URL = '/events/';

describe('ReconnectingEventSource', () => {
  let clock: sinon.SinonFakeTimers;
  let createEventSourceStub: sinon.SinonStub;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    createEventSourceStub = sinon
      .stub(ReconnectingEventSource.prototype as any, 'createEventSource')
      .callsFake(() => {
        return new EventSourceMock(URL);
      });
  });

  afterEach(() => {
    createEventSourceStub.restore();
    clock.restore();
  });

  it('起動後n秒経過でonDisconnect()が実行される', () => {
    const disconnectSpy = sinon.spy();
    const sut = new ReconnectingEventSource(
      URL,
      () => {},
      disconnectSpy,
      10,
      20
    );

    clock.tick(9000);
    expect(disconnectSpy.callCount).to.equal(0);

    clock.tick(1500);
    expect(disconnectSpy.callCount).to.equal(1);
  });

  it('切断後n秒おきに再接続を繰り返し試みる', () => {
    const sut = new ReconnectingEventSource(URL, () => {}, () => {}, 10, 20);
    clock.tick(29500);
    expect(createEventSourceStub.callCount).to.equal(1);

    clock.tick(1000);
    expect(createEventSourceStub.callCount).to.equal(2);

    clock.tick(20000);
    expect(createEventSourceStub.callCount).to.equal(3);

    clock.tick(20000);
    expect(createEventSourceStub.callCount).to.equal(4);
  });

  it('接続確認できたらonConnected()実行し、再接続をやめる', () => {
    const onConnectedSpy = sinon.spy();
    const sut = new ReconnectingEventSource(
      URL,
      onConnectedSpy,
      () => {},
      10,
      20
    );
    clock.tick(40000); // 40s
    expect(onConnectedSpy.callCount).to.equal(1);
    expect(createEventSourceStub.callCount).to.equal(2);

    const ev = new MessageEvent(EventType.ALIVE, {});
    sources[URL].emit(ev.type, ev);
    expect(onConnectedSpy.callCount).to.equal(2);

    clock.tick(5000); // 45s
    sources[URL].emit(ev.type, ev);

    clock.tick(5000); // 50s
    sources[URL].emit(ev.type, ev);

    clock.tick(5000); // 55s
    expect(onConnectedSpy.callCount).to.equal(2);
    expect(createEventSourceStub.callCount).to.equal(2);
  });

  it('切断状態でなければ、eventを受信してもonConnectedは実行されない', () => {
    //TODO
  });
});
