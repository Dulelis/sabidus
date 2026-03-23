import { useState } from 'react';

import { ScreenLayout } from '@/components/ScreenLayout';
import { HomeScreen } from '@/screens/HomeScreen';

export default function HomeRoute() {
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('todos');

  return (
    <ScreenLayout>
      <HomeScreen
        query={query}
        setQuery={setQuery}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
      />
    </ScreenLayout>
  );
}
