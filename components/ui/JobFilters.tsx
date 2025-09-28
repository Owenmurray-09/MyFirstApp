import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { theme } from '@/config/theme';
import { Input } from './Input';
import { Tag } from './Tag';
import { Button } from './Button';

interface JobFiltersProps {
  onFiltersChange: (filters: {
    keyword: string;
    paidOnly: boolean;
    location: string;
    tags: string[];
  }) => void;
  availableTags: string[];
}

export const JobFilters: React.FC<JobFiltersProps> = ({ onFiltersChange, availableTags }) => {
  const [keyword, setKeyword] = useState('');
  const [paidOnly, setPaidOnly] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Real-time filter updates
  useEffect(() => {
    onFiltersChange({ keyword, paidOnly, location, tags: selectedTags });
  }, [keyword, paidOnly, location, selectedTags, onFiltersChange]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setKeyword('');
    setPaidOnly(false);
    setLocation('');
    setSelectedTags([]);
  };

  return (
    <View style={styles.container}>
      <Input
        placeholder="Search jobs..."
        value={keyword}
        onChangeText={setKeyword}
        style={styles.searchInput}
      />
      
      <View style={styles.quickFilters}>
        <View style={styles.paidFilter}>
          <Text style={styles.filterLabel}>Paid jobs only</Text>
          <Switch value={paidOnly} onValueChange={setPaidOnly} />
        </View>

        <Button
          title={isExpanded ? 'Less Filters' : 'More Filters'}
          onPress={() => setIsExpanded(!isExpanded)}
          variant="outline"
          size="sm"
        />
      </View>

      {isExpanded && (
        <View style={styles.expandedFilters}>
          <Input
            label="Location"
            placeholder="City, State"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.filterLabel}>Skills & Interests</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
            <View style={styles.tagsContainer}>
              {availableTags.map(tag => (
                <Tag
                  key={tag}
                  label={tag}
                  selected={selectedTags.includes(tag)}
                  onPress={() => handleTagToggle(tag)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <Button title="Clear All" onPress={clearFilters} variant="outline" size="sm" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    marginBottom: 0,
  },
  quickFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  paidFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  filterLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  expandedFilters: {
    marginTop: theme.spacing.md,
  },
  tagsScroll: {
    marginVertical: theme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingRight: theme.spacing.md,
  },
  filterActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
});