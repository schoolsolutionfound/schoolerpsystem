import React from 'react';
import { BusTrackingView } from '../../shared/transport/BusTrackingView';

export const ParentBusTrackingView: React.FC = () => <BusTrackingView audience="parent" />;

export const ParentTrackView = ParentBusTrackingView;
