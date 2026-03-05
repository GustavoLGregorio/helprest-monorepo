import { useQuery } from '@tanstack/react-query';

export default function usePlacesQuery() {
	const { data, isLoading, isSuccess, isError } = useQuery({
		queryKey: ['places'],
		queryFn: async () => {
			const response = await fetch(
				'https://prototipo-help-rest.vercel.app/api/locais',
			);

			return response.json();
		},
	});

	return { data, isLoading, isSuccess, isError };
}
