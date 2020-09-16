// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import renderer from 'react-test-renderer';
import Enzyme, { shallow } from 'enzyme'
import { shallowToJson  } from 'enzyme-to-json';
import Adapter from 'enzyme-adapter-react-16';

import { Olive, Modal } from '@olive/react'

import ModalLogin from '../components/ModalLogin';
Enzyme.configure({ adapter: new Adapter() })


it('ModalLogin renders closed', () => {
  const tree = renderer
    .create(
        <Olive><Modal.Portal><ModalLogin/></Modal.Portal></Olive>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});

it('ModalLogin opens', () => {
    const appObject = {blocklySection: {blocklyClearSelection: () => {}}}
    const wrapper = shallow(<ModalLogin appObject={appObject}/>);
    const msg = "THIS IS THE MESSAGE";
    wrapper.instance().show(msg);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
    expect(wrapper.contains(<p>{msg}</p>)).toBe(true);
});