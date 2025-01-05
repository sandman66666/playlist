// src/components/brand/BrandForm.tsx
import React from 'react';
import {
  FormContainer,
  FormSection,
  FormField,
  Input,
  Textarea,
  Select,
} from '../shared/Form';
import { Button } from '../shared/Button';
import { useCreateBrand } from '../../hooks/useSpotify';
import { BrandProfile } from '../../types';

interface BrandFormProps {
  onSuccess?: (brand: BrandProfile) => void;
}

export const BrandForm: React.FC<BrandFormProps> = ({ onSuccess }) => {
  const { mutate: createBrand, isPending } = useCreateBrand();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      brandEssence: {
        coreIdentity: formData.get('coreIdentity') as string,
        heritage: formData.get('heritage') as string,
        brandVoice: formData.get('brandVoice') as string
      }
    };

    createBrand({
      brand: data.name,
      description: data.description,
      data: {
        brand_essence: {
          core_identity: data.brandEssence.coreIdentity,
          heritage: data.brandEssence.heritage,
          brand_voice: data.brandEssence.brandVoice
        }
      }
    }, {
      onSuccess: (brand: any) => {
        onSuccess?.(brand);
      }
    });
  };

  return (
    <FormContainer onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <FormSection
        title="Basic Information"
        description="Enter the fundamental details about your brand"
      >
        <FormField
          label="Brand Name"
          required
        >
          <Input 
            name="name"
            placeholder="Enter brand name"
            required 
          />
        </FormField>

        <FormField
          label="Description"
          required
        >
          <Textarea
            name="description"
            placeholder="Describe your brand"
            required
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Brand Essence"
        description="Define the core elements that make your brand unique"
      >
        <FormField
          label="Core Identity"
          required
        >
          <Input
            name="coreIdentity"
            placeholder="What defines your brand at its core?"
            required
          />
        </FormField>

        <FormField
          label="Heritage"
        >
          <Textarea
            name="heritage"
            placeholder="Describe your brand's history and heritage"
          />
        </FormField>

        <FormField
          label="Brand Voice"
          required
        >
          <Input
            name="brandVoice"
            placeholder="How does your brand communicate?"
            required
          />
        </FormField>
      </FormSection>

      <div className="flex justify-end space-x-4 mt-8">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isPending}
        >
          Create Brand
        </Button>
      </div>
    </FormContainer>
  );
};