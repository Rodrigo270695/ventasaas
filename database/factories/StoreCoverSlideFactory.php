<?php

namespace Database\Factories;

use App\Models\StoreCoverSlide;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StoreCoverSlide>
 */
class StoreCoverSlideFactory extends Factory
{
    protected $model = StoreCoverSlide::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'subtitle' => fake()->optional()->sentence(6),
            'image_path' => 'covers/'.fake()->uuid().'.jpg',
            'sort_order' => fake()->numberBetween(0, 10),
            'is_active' => true,
        ];
    }
}
