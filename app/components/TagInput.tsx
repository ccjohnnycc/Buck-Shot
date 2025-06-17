import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type TagInputProps = {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder?: string;
};

export default function TagInput({ tags, setTags, placeholder = 'Add a tag...' }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = () => {
    console.log('addTag:', input);
    const newTag = input.trim();
    if (!newTag || tags.includes(newTag)) return;

    // add new tag to the tags array
    setTags(prev => [...prev, newTag]);
    setInput('');
  };

  const removeTag = (tagToRemove: string) => {
    // functional update
    setTags((prev: string[]) => prev.filter((tag: string) => tag !== tagToRemove));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.tagList}>
        {tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={14} color="black" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={addTag}
        returnKeyType="done"
        blurOnSubmit
      />

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '90%',
    marginBottom: 20,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#000',
    fontWeight: 'bold',
    marginRight: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  input: {
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});