import './editor.scss';
import { useState, useEffect, useRef } from '@wordpress/element';
import {
	Spinner,
	SearchControl,
	Button,
	Modal,
	CheckboxControl,
} from '@wordpress/components';
import { FiClock, FiX } from 'react-icons/fi';
import { SmartFrameComponent } from './smartframe-element';

const RECENT_SEARCHES_KEY = 'sfRecentSearches';
const MAX_RECENT_SEARCHES = 5;
export function SmartframeLibrary( { onClose, onInsert, apiKey } ) {
	const [ isApiConnected, setIsApiConnected ] = useState( false );
	const [ istooManyRequests, setIstooManyRequests ] = useState( false );
	const [ isCheckingApi, setIsCheckingApi ] = useState( true );
	const [ isTyping, setIsTyping ] = useState( false );
	const [ searchInput, setSearchInput ] = useState( '' );
	const [ debouncedSearchInput, setDebouncedSearchInput ] =
		useState( searchInput );
	const [ recentSearches, setRecentSearches ] = useState( [] );
	const [ isSearchFocused, setIsSearchFocused ] = useState( false );
	const [ activeTab, setActiveTab ] = useState( 'events' );
	const [ selectedCategory, setSelectedCategory ] = useState( 'all' );
	const [ selectedCollectionId, setSelectedCollectionId ] = useState( null );
	const [ noResultsFound, setNoResultsFound ] = useState( false );
	const [ sortValue, setSortValue ] = useState( 'date_desc' );
	const [ selectedEvent, setSelectedEvent ] = useState( null );
	const [ hasManualSort, setHasManualSort ] = useState( false );
	const searchWrapperRef = useRef( null );
	const recentSearchesRef = useRef( null );

	//State of Events and their pagination
	const [ events, setEvents ] = useState( [] );
	const [ isLoadingEvents, setIsLoadingEvents ] = useState( true );
	const [ currentPage, setCurrentPage ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 1 );
	const pageSize = 24;

	const eventCategories = [
		{ name: 'All', value: 'all' },
		{ name: 'Sports', value: 'sport' },
		{ name: 'News', value: 'news' },
		{ name: 'Entertainment', value: 'entertainment' },
		{ name: 'Lifestyle and Culture', value: 'lifestyleculture' },
		{ name: 'Science', value: 'science' },
	];

	useEffect( () => {
		try {
			const storedSearches = localStorage.getItem( RECENT_SEARCHES_KEY );
			if ( storedSearches ) {
				setRecentSearches( JSON.parse( storedSearches ) );
			}
		} catch ( e ) {}
	}, [] );

	const updateRecentSearches = ( searchTerm ) => {
		if ( ! searchTerm ) {
			return;
		}

		const newSearches = [
			searchTerm,
			...recentSearches.filter( ( s ) => s !== searchTerm ),
		].slice( 0, MAX_RECENT_SEARCHES );

		setRecentSearches( newSearches );

		try {
			localStorage.setItem(
				RECENT_SEARCHES_KEY,
				JSON.stringify( newSearches )
			);
		} catch ( e ) {}
	};

	const handleRecentSearchClick = ( searchTerm ) => {
		handleSearchChange( searchTerm );
		setDebouncedSearchInput( searchTerm );
		setIsSearchFocused( false );
	};

	const handleClearSingleSearch = ( searchTermToRemove ) => {
		const newSearches = recentSearches.filter(
			( s ) => s !== searchTermToRemove
		);
		setRecentSearches( newSearches );
		try {
			localStorage.setItem(
				RECENT_SEARCHES_KEY,
				JSON.stringify( newSearches )
			);
		} catch ( e ) {}
	};

	const handleClearAllSearches = () => {
		setRecentSearches( [] );
		try {
			localStorage.removeItem( RECENT_SEARCHES_KEY );
		} catch ( e ) {}
	};

	const handleTabClick = ( tab ) => {
		if ( tab === activeTab ) {
			return;
		}

		setActiveTab( tab );
		if ( tab === 'images' ) {
			setImages( [] );
			setImagesCurrentPage( 0 );
			setSelectedCollectionId( null );
			setSelectedEvent( null );
		} else {
			setEvents( [] );
			setCurrentPage( 0 );
		}
	};

	const handleSearchChange = ( value ) => {
		setCurrentPage( 0 );
		setImagesCurrentPage( 0 );
		setSearchInput( value );
		if ( value && selectedCollectionId ) {
			setSelectedCollectionId( null );
			setSelectedEvent( null );
		}

		if ( value ) {
			if ( ! hasManualSort ) {
				setSortValue( 'relevance' );
			}
			setIsTyping( true );
		} else {
			setIsTyping( false );
			if ( ! hasManualSort ) {
				setSortValue( 'date_desc' );
			}
		}
	};

	const handleCategoryClick = ( category ) => {
		setSelectedCategory( category );
		setCurrentPage( 0 );
		setImagesCurrentPage( 0 );
		setSelectedEvent( null );
		setSelectedCollectionId( null );
	};

	const handleEventClick = ( event ) => {
		setImages( [] );
		setSelectedCollectionId( event.folderPublicId );
		setSelectedEvent( event );
		setImagesCurrentPage( 0 );
		setActiveTab( 'images' );
		//setSearchInput( '' );
	};

	const handleBackToEvents = () => {
		setActiveTab( 'events' );
		setSelectedCollectionId( null );
		setSelectedEvent( null );
		setImages( [] );
	};

	// State for images and their pagination
	const [ images, setImages ] = useState( [] );
	const [ isLoadingImages, setIsLoadingImages ] = useState( true );
	const [ imagesCurrentPage, setImagesCurrentPage ] = useState( 0 );
	const [ imagesTotalPages, setImagesTotalPages ] = useState( 1 );

	useEffect( () => {
		function handleClickOutside( event ) {
			if (
				searchWrapperRef.current &&
				! searchWrapperRef.current.contains( event.target ) &&
				recentSearchesRef.current &&
				! recentSearchesRef.current.contains( event.target )
			) {
				setIsSearchFocused( false );
			}
		}

		document.addEventListener( 'mousedown', handleClickOutside );

		return () => {
			document.removeEventListener( 'mousedown', handleClickOutside );
		};
	}, [] );

	useEffect( () => {
		if ( searchInput ) {
			// if ( selectedCollectionId ) {
			// 	setSelectedCollectionId( null );
			// }
			setEvents( [] );
			setImages( [] );
			setCurrentPage( 0 );
			setImagesCurrentPage( 0 );
			setNoResultsFound( false );
		}

		const handler = setTimeout( () => {
			setDebouncedSearchInput( searchInput );
			if ( searchInput.trim() ) {
				updateRecentSearches( searchInput.trim() );
			}
		}, 500 );

		return () => {
			clearTimeout( handler );
		};
	}, [ searchInput, selectedCollectionId ] );

	//Image preview on right sidebar
	const [ selectedImage, setSelectedImage ] = useState( false );
	const [ showCaption, setShowCaption ] = useState( true );

	useEffect( () => {
		if ( ! apiKey || typeof apiKey !== 'string' || apiKey === '' ) {
			setIsCheckingApi( false );
			setIsApiConnected( false );
			return;
		}

		const testApiConnection = async () => {
			setIsCheckingApi( true );
			try {
				const response = await fetch(
					'https://api2.smartframe.io/search-api/search/collections',
					{
						method: 'GET',
						headers: {
							'X-API-KEY': apiKey,
						},
					}
				);

				if ( response.ok ) {
					setIsApiConnected( true );
				} else if ( response.status === 429 ) {
					setIsApiConnected( false );
					setIstooManyRequests( true );
				} else {
					setIsApiConnected( false );
				}
			} catch ( e ) {
				setIsApiConnected( false );
			} finally {
				setIsCheckingApi( false );
			}
		};

		testApiConnection();
	}, [ apiKey ] );

	// Fetch events from API with pagination
	useEffect( () => {
		if ( ! isApiConnected || activeTab !== 'events' ) {
			setIsLoadingEvents( false );
			return;
		}

		const fetchEvents = async () => {
			setIsLoadingEvents( true );
			setNoResultsFound( false );

			let url = `https://api2.smartframe.io/search-api/search/collections?category=${ selectedCategory }&pageSize=${ pageSize }&sort=${ sortValue }&page=${ currentPage }`;

			if ( debouncedSearchInput ) {
				url += `&phrase=${ encodeURIComponent(
					debouncedSearchInput
				) }`;
			}

			try {
				const response = await fetch( url, {
					method: 'GET',
					headers: {
						'X-API-KEY': apiKey,
					},
				} );

				if ( response.ok ) {
					const data = await response.json();
					setEvents( data.results || [] );
					setTotalPages( data.totalPages || 1 );
					setCurrentPage( data.currentPage || 0 );
					if ( ! data.results || data.results.length === 0 ) {
						setNoResultsFound( true );
					}
				} else if ( response.status === 429 ) {
					setIstooManyRequests( true );
				} else {
					setEvents( [] );
					setNoResultsFound( true );
				}
			} catch ( e ) {
				setEvents( [] );
				setNoResultsFound( true );
			} finally {
				setIsLoadingEvents( false );
				setIsTyping( false );
			}
		};

		fetchEvents();
	}, [
		isApiConnected,
		apiKey,
		currentPage,
		activeTab,
		selectedCategory,
		sortValue,
		debouncedSearchInput,
	] );

	// Fetch Images data with pagination
	useEffect( () => {
		if ( activeTab !== 'images' || ! isApiConnected ) {
			return;
		}

		const fetchImages = async () => {
			setIsLoadingImages( true );
			setNoResultsFound( false );

			const baseUrl =
				'https://api2.smartframe.io/search-api/search/images';
			let url;

			if ( selectedCollectionId ) {
				// Scenario 1: A collection (event) is selected.
				url = `${ baseUrl }?collection=${ selectedCollectionId }&pageSize=${ pageSize }&sort=${ sortValue }&page=${ imagesCurrentPage }`;
			} else {
				// Scenario 2: No collection, so perform a general search, combining category and phrase.
				const params = new URLSearchParams( {
					pageSize: pageSize.toString(),
					sort: sortValue,
					page: imagesCurrentPage.toString(),
				} );

				if ( debouncedSearchInput ) {
					params.append( 'phrase', debouncedSearchInput );
				}

				if ( selectedCategory && selectedCategory !== 'all' ) {
					params.append( 'category', selectedCategory );
				}

				url = `${ baseUrl }?${ params.toString() }`;
			}

			try {
				const response = await fetch( url, {
					method: 'GET',
					headers: {
						'X-API-KEY': apiKey,
					},
				} );

				if ( response.ok ) {
					const data = await response.json();
					if ( data.results && data.results.length > 0 ) {
						const processedImages = ( data.results || [] ).map(
							( img ) => ( {
								...img,
								dimensions: `${ img.width }x${ img.height }`,
							} )
						);
						setImages( processedImages );
						setImagesTotalPages( data.totalPages || 1 );
						setImagesCurrentPage( data.currentPage || 0 );
					} else {
						setImages( [] );
						setNoResultsFound( true );
					}
				} else if ( response.status === 429 ) {
					setIstooManyRequests( true );
				} else {
					setImages( [] );
					setNoResultsFound( true );
				}
			} catch ( e ) {
				setImages( [] );
				setNoResultsFound( true );
			} finally {
				setIsLoadingImages( false );
				setIsTyping( false );
			}
		};

		fetchImages();
	}, [
		isApiConnected,
		activeTab,
		debouncedSearchInput,
		selectedCollectionId,
		imagesCurrentPage,
		sortValue,
		selectedCategory,
		apiKey,
	] );

	const modalHeader = (
		<div
			className={
				'grid grid-cols-6 grid-rows-1 bg-black p-4 h-full items-center content-center'
			}
		>
			<div className={ 'sf-logo col-span-3' }>
				<a
					href={ 'https://smartframe.com/' }
					target={ '_blank' }
					rel="noreferrer"
				>
					<svg
						width="169"
						height="16"
						viewBox="0 0 169 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M33.9342 14.7738C32.352 14.7738 29.7919 14.1401 28.5901 12.7714C28.4687 12.632 28.4111 12.4926 28.4111 12.3342C28.4111 12.1948 28.4527 12.0775 28.5518 11.9572C28.6732 11.8368 28.8107 11.7575 28.9737 11.7575C29.1143 11.7575 29.2741 11.8177 29.3924 11.916C30.6932 13.028 32.2753 13.6015 33.9565 13.6015C35.6377 13.6015 37.6002 12.9678 37.6002 11.1619C37.6002 9.69498 35.8583 9.11835 33.0169 8.08548C31.195 7.42964 29.1942 6.63757 29.1942 4.41658C29.1942 2.0752 31.374 1.06451 33.9757 1.06451C35.6377 1.06451 37.4787 1.66016 38.5591 2.47441C38.738 2.61382 38.8179 2.79124 38.8179 2.97183C38.8179 3.07005 38.7764 3.19045 38.7189 3.28867C38.5974 3.44708 38.4184 3.5453 38.2394 3.5453C38.118 3.5453 37.9997 3.50411 37.9006 3.44708C36.6989 2.69302 35.5387 2.23679 33.9789 2.23679C32.1379 2.23679 30.4982 2.89263 30.4982 4.41975C30.4982 5.94687 32.3201 6.52351 34.8195 7.39479C37.1815 8.20904 38.9234 9.08033 38.9234 11.1049C38.9234 13.5857 36.6413 14.7738 33.9406 14.7738H33.9342Z"
							fill="white"
						/>
						<path
							d="M54.5054 14.6756C54.1667 14.6756 53.8854 14.3968 53.8854 14.061V4.40079C52.7635 6.66296 49.3436 14.3398 49.3436 14.3398C49.2445 14.5584 49.024 14.6756 48.7843 14.6756C48.5254 14.6756 48.324 14.5774 48.2249 14.3398L43.6831 4.4198V14.0419C43.6831 14.3778 43.3827 14.6756 43.0439 14.6756C42.7051 14.6756 42.4238 14.3778 42.4238 14.0419V1.74258C42.4238 1.40674 42.7051 1.12793 43.0439 1.12793C43.3252 1.12793 43.5233 1.30535 43.6256 1.52397L48.7875 12.7524L53.9301 1.50496C54.0292 1.28634 54.2497 1.12793 54.5118 1.12793C54.8506 1.12793 55.1319 1.42575 55.1319 1.76159V14.061C55.1319 14.3968 54.8506 14.6756 54.5118 14.6756H54.5054Z"
							fill="white"
						/>
						<path
							d="M70.4737 14.6154C70.3938 14.6566 70.3139 14.6756 70.234 14.6756C69.9942 14.6756 69.7737 14.5552 69.6746 14.3176L67.9934 10.6487H61.1695L59.5075 14.2986C59.4084 14.5172 59.1879 14.6756 58.9482 14.6756C58.8683 14.6756 58.7692 14.6566 58.6893 14.6154C58.4688 14.5172 58.3281 14.2986 58.3281 14.061C58.3281 13.9817 58.3281 13.8835 58.3697 13.8043L64.0142 1.50496C64.0749 1.36555 64.2954 1.12793 64.5959 1.12793C64.8963 1.12793 65.0977 1.38456 65.1552 1.50496L70.7997 13.8043C70.8412 13.8835 70.8412 13.9817 70.8412 14.061C70.8412 14.2986 70.7006 14.5172 70.4801 14.6154H70.4737ZM64.5927 3.16832L61.6905 9.5176H67.4724L64.5895 3.16832H64.5927Z"
							fill="white"
						/>
						<path
							d="M81.1807 8.42771C81.1807 8.42771 81.2606 8.62731 83.7824 13.7853C83.824 13.8835 83.8432 13.9627 83.8432 14.0641C83.8432 14.2827 83.7217 14.5204 83.5044 14.6186C83.4244 14.6598 83.3254 14.6788 83.2455 14.6788C83.0057 14.6788 82.7852 14.5394 82.6638 14.3208C79.8607 8.62732 79.8607 8.6083 79.8607 8.6083H74.9577V14.0451C74.9577 14.4031 74.6381 14.6788 74.2769 14.6788C73.9158 14.6788 73.6377 14.4 73.6377 14.0451V1.93902C73.6377 1.581 73.919 1.30536 74.2769 1.30536H80.0013C82.2834 1.30536 83.9646 2.69308 83.9646 4.97426C83.9646 6.70098 82.8843 8.10771 81.1839 8.42454L81.1807 8.42771ZM80.142 2.47446H74.9577V7.49306H80.142C81.6026 7.49306 82.6446 6.46019 82.6446 4.99327C82.6446 3.52634 81.6026 2.47446 80.142 2.47446Z"
							fill="white"
						/>
						<path
							d="M96.2891 2.49664H92.0861V14.0229C92.0861 14.381 91.7857 14.6788 91.4245 14.6788C91.0633 14.6788 90.7629 14.381 90.7629 14.0229V2.49664H86.5599C86.2211 2.49664 85.959 2.24001 85.959 1.901C85.959 1.56199 86.2179 1.30536 86.5599 1.30536H96.2859C96.6247 1.30536 96.906 1.56199 96.906 1.901C96.906 2.24001 96.6247 2.49664 96.2859 2.49664H96.2891Z"
							fill="white"
						/>
						<path
							d="M108.518 2.49664H101.233V7.03999H105.456C105.794 7.03999 106.037 7.29663 106.037 7.63563C106.037 7.97464 105.798 8.23128 105.456 8.23128H101.233V14.0451C101.233 14.4031 100.933 14.6788 100.572 14.6788C100.211 14.6788 99.9102 14.4 99.9102 14.0451V1.93902C99.9102 1.581 100.211 1.30536 100.572 1.30536H108.518C108.856 1.30536 109.118 1.56199 109.118 1.901C109.118 2.24001 108.86 2.49664 108.518 2.49664Z"
							fill="white"
						/>
						<path
							d="M119.564 8.42771C119.564 8.42771 119.643 8.62731 122.165 13.7853C122.207 13.8835 122.226 13.9627 122.226 14.0641C122.226 14.2827 122.105 14.5204 121.887 14.6186C121.807 14.6598 121.708 14.6788 121.628 14.6788C121.389 14.6788 121.168 14.5394 121.047 14.3208C118.244 8.62732 118.244 8.6083 118.244 8.6083H113.341V14.0451C113.341 14.4031 113.021 14.6788 112.66 14.6788C112.299 14.6788 112.021 14.4 112.021 14.0451V1.93902C112.021 1.581 112.302 1.30536 112.66 1.30536H118.384C120.666 1.30536 122.347 2.69308 122.347 4.97426C122.347 6.70098 121.267 8.10771 119.567 8.42454L119.564 8.42771ZM118.522 2.47446H113.337V7.49306H118.522C119.982 7.49306 121.024 6.46019 121.024 4.99327C121.024 3.52634 119.982 2.47446 118.522 2.47446Z"
							fill="white"
						/>
						<path
							d="M137.092 14.6154C137.012 14.6566 136.932 14.6756 136.852 14.6756C136.612 14.6756 136.392 14.5552 136.293 14.3176L134.612 10.6487H127.788L126.126 14.2986C126.027 14.5172 125.806 14.6756 125.566 14.6756C125.486 14.6756 125.387 14.6566 125.307 14.6154C125.087 14.5172 124.946 14.2986 124.946 14.061C124.946 13.9817 124.946 13.8835 124.988 13.8043L130.632 1.50496C130.693 1.36555 130.914 1.12793 131.214 1.12793C131.514 1.12793 131.716 1.38456 131.773 1.50496L137.418 13.8043C137.459 13.8835 137.459 13.9817 137.459 14.061C137.459 14.2986 137.319 14.5172 137.098 14.6154H137.092ZM131.211 3.16832L128.309 9.5176H134.091L131.208 3.16832H131.211Z"
							fill="white"
						/>
						<path
							d="M152.443 14.6756C152.104 14.6756 151.823 14.3968 151.823 14.061V4.40079C150.701 6.66296 147.281 14.3398 147.281 14.3398C147.182 14.5584 146.961 14.6756 146.722 14.6756C146.463 14.6756 146.262 14.5774 146.162 14.3398L141.621 4.4198V14.0419C141.621 14.3778 141.32 14.6756 140.981 14.6756C140.643 14.6756 140.361 14.3778 140.361 14.0419V1.74258C140.361 1.40674 140.643 1.12793 140.981 1.12793C141.263 1.12793 141.461 1.30535 141.563 1.52397L146.725 12.7524L151.868 1.50496C151.967 1.28634 152.187 1.12793 152.449 1.12793C152.788 1.12793 153.069 1.42575 153.069 1.76159V14.061C153.069 14.3968 152.788 14.6756 152.449 14.6756H152.443Z"
							fill="white"
						/>
						<path
							d="M166.111 14.5172H158.126C157.765 14.5172 157.465 14.2194 157.465 13.8614V1.93902C157.465 1.581 157.765 1.30536 158.126 1.30536H165.81C166.149 1.30536 166.43 1.56199 166.43 1.901C166.43 2.24001 166.149 2.49664 165.81 2.49664H158.766V7.03999H162.748C163.087 7.03999 163.349 7.29663 163.349 7.63563C163.349 7.97464 163.09 8.23128 162.748 8.23128H158.766V13.3291H166.111C166.449 13.3291 166.711 13.5857 166.711 13.9247C166.711 14.2637 166.453 14.5204 166.111 14.5204V14.5172Z"
							fill="white"
						/>
						<path
							d="M21.9265 11.9825L21.121 1.72673C21.1146 0.80475 20.3571 0.0601978 19.4271 0.0601978C19.4207 0.0601978 19.4111 0.0601978 19.4047 0.0601978L4.30265 0L4.29626 0.00633661C4.2643 0.00633661 4.23234 0 4.19718 0C3.26069 0 2.5 0.754057 2.5 1.68237C2.5 1.70772 2.5 1.7299 2.5032 1.75207H2.5L3.31823 14.1972C3.3374 15.1097 4.08851 15.8415 5.01221 15.8415C5.1017 15.8415 5.188 15.832 5.2743 15.8194V15.8257L20.4275 13.9722C21.2777 13.8803 21.9425 13.1675 21.9425 12.2994C21.9425 12.1916 21.9361 12.0871 21.9265 11.9825ZM19.0915 12.7714L6.40575 14.2605C6.33224 14.2669 6.26192 14.2732 6.18521 14.2732C5.41173 14.2732 4.78528 13.6839 4.7661 12.9552L4.08212 2.97504H4.08531C4.08531 2.95603 4.08531 2.93702 4.08531 2.91801C4.08531 2.17346 4.72136 1.57148 5.50442 1.57148C5.53319 1.57148 5.55876 1.57148 5.58753 1.57465L5.59392 1.56831L18.2381 1.61584C18.2381 1.61584 18.2509 1.61584 18.2572 1.61584C19.0371 1.61584 19.6476 2.21781 19.6764 2.95286L20.3571 11.181C20.3667 11.2728 20.3635 11.3457 20.3635 11.4312C20.3635 12.1283 19.8074 12.6986 19.0978 12.7714H19.0915Z"
							fill="white"
						/>
					</svg>
				</a>
			</div>
			<div
				className={
					'top-bar-right col-span-3 flex items-center content-center self-center justify-self-end'
				}
			>
				<a
					className={
						'sf-top-bar-item p-1 !text-white hover:text-white hover:opacity-50 text-[13px] font-normal h-24px'
					}
					href={ 'https://smartframe.io/privacy-policy/' }
					target={ '_blank' }
					rel="noreferrer"
				>
					Privacy Policy
				</a>
				<a
					className={
						'sf-top-bar-item p-1 !text-white hover:text-white hover:opacity-50 text-[13px] font-normal h-24px'
					}
					href={ 'https://smartframe.io/help-center/' }
					target={ '_blank' }
					rel="noreferrer"
				>
					Help
				</a>
			</div>
		</div>
	);

	return (
		<Modal
			title={ modalHeader }
			overlayClassName={ 'sfimages-library-modal-results' }
			onRequestClose={ onClose }
			shouldCloseOnEsc={ true }
			isFullScreen={ true }
		>
			<div className={ 'content' } id={ 'sfimages-modal-results' }>
				{ isCheckingApi && <Spinner /> }
				{ ! isCheckingApi && istooManyRequests && (
					<section className={ 'grid grid-cols-4 gap-0' }>
						<p
							className={
								'col-span-4 error-embed-code text-3xl p-4 text-center'
							}
						>
							Too many requests. Please try again later.
						</p>
					</section>
				) }
				{ ! isCheckingApi &&
					! istooManyRequests &&
					( isApiConnected ? (
						<section className={ 'grid grid-cols-4 gap-0' }>
							<div
								className={
									'flex flex-col md:flex-row col-span-4 bg-menu p-4'
								}
							>
								<div
									className={
										'flex-shrink-0 sf-categories bg-menu self-center pr-6'
									}
								>
									{ eventCategories.map( ( category ) => (
										<button
											type="button"
											key={ category.value }
											onClick={ () =>
												handleCategoryClick(
													category.value
												)
											}
											className={ `text-base sf-category-item cursor-pointer pr-6 py-[8px] ${
												selectedCategory ===
												category.value
													? 'current underline text-primary'
													: 'text-primary-weak'
											}` }
										>
											{ category.name }
										</button>
									) ) }
								</div>
								<div
									ref={ searchWrapperRef }
									className={
										'relative search-bar bg-menu flex-1'
									}
								>
									<SearchControl
										__nextHasNoMarginBottom
										hideLabelFromVision={ true }
										label={ 'Search all images...' }
										placeholder={ 'Search all images...' }
										value={ searchInput }
										className={
											'sfimages-search-component'
										}
										onChange={ handleSearchChange }
										onFocus={ () =>
											setIsSearchFocused( true )
										}
									/>
									{ isSearchFocused &&
										recentSearches.length > 0 && (
											<div
												ref={ recentSearchesRef }
												className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1"
											>
												<div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
													<p className="text-sm font-medium text-base m-0">
														Recent Searches
													</p>
													<button
														type="button"
														onClick={
															handleClearAllSearches
														}
														className="cursor-pointer text-xs text-primary-weak hover:text-primary focus:outline-none"
													>
														Clear All
													</button>
												</div>
												<ul>
													{ recentSearches.map(
														(
															searchTerm,
															index
														) => (
															<li
																key={ `${ searchTerm }-${ index }` }
																className="flex items-center justify-between px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 group"
															>
																<button
																	type="button"
																	onMouseDown={ (
																		e
																	) => {
																		e.preventDefault();
																		handleRecentSearchClick(
																			searchTerm
																		);
																	} }
																	className="flex items-center space-x-2 bg-transparent border-none p-0 text-left cursor-pointer"
																>
																	<FiClock className="text-gray-400 text-base" />
																	<span>
																		{
																			searchTerm
																		}
																	</span>
																</button>

																<button
																	type="button"
																	className="cursor-pointer clear-single-search-btn text-gray-400 hover:text-primary text-xs border-1 rounded-full focus:outline-none"
																	onMouseDown={ (
																		e
																	) => {
																		e.stopPropagation();
																		handleClearSingleSearch(
																			searchTerm
																		);
																	} }
																	aria-label="Remove search term"
																>
																	<FiX />
																</button>
															</li>
														)
													) }
												</ul>
											</div>
										) }
								</div>
							</div>
							{ /* --- TABS START --- */ }
							<div
								className={
									'grid grid-cols-5 grid-rows-1 col-span-4 bg-white p-4'
								}
							>
								{ selectedCollectionId && selectedEvent ? (
									// When viewing images within an event
									<div className="flex items-center col-span-4 text-sm text-gray-600">
										<Button
											isSecondary
											onClick={ handleBackToEvents }
										>
											&larr; Back
										</Button>
										<h3 className="pl-2 text-lg font-medium text-black m-0">
											{ selectedEvent.title }
										</h3>
									</div>
								) : (
									<div
										className={
											'sf-categories self-center col-span-4 flex justify-left'
										}
									>
										<button
											type="button"
											className={ `text-center text-base sf-category-item cursor-pointer px-[16px] py-[4px] rounded-lg border border-black w-[122px] rounded-r-none ${
												activeTab === 'images'
													? 'current text-primary bg-black text-white hover:text-white'
													: 'text-primary'
											}` }
											onClick={ () => {
												handleTabClick( 'images' );
											} }
										>
											Images
										</button>
										<button
											type="button"
											className={ `text-center text-base sf-category-item cursor-pointer px-[16px] py-[4px] rounded-lg border border-black w-[122px] rounded-l-none ${
												activeTab === 'events'
													? 'current text-primary bg-black text-white hover:text-white'
													: 'text-primary'
											}` }
											onClick={ () => {
												handleTabClick( 'events' );
											} }
										>
											Events
										</button>
									</div>
								) }
								{ ( activeTab === 'images' ||
									activeTab === 'events' ) && (
									<div className="col-span-1 flex justify-end items-center sort-by-container">
										<label
											htmlFor="sf-sort-by"
											className="text-base mr-2"
										>
											Sort by:
										</label>
										<select
											id="sf-sort-by"
											value={ sortValue }
											onChange={ ( e ) => {
												setHasManualSort( true );
												setSortValue( e.target.value );
												setImagesCurrentPage( 0 );
												setCurrentPage( 0 );
												if ( activeTab === 'images' ) {
													setImages( [] );
												} else {
													setEvents( [] );
												}
											} }
											className="p-4 border !text-base"
										>
											{ searchInput && (
												<option value="relevance">
													Relevance
												</option>
											) }
											<option value="date_desc">
												Date Desc
											</option>
											<option value="date_asc">
												Date Asc
											</option>
										</select>
									</div>
								) }
							</div>
							{ /* --- TABS END --- */ }

							{ /* --- START: Search results indicator --- */ }
							<div
								className={
									'col-span-4 bg-white border-b-1 border-search-border'
								}
							>
								{ debouncedSearchInput &&
									! selectedCollectionId && (
										<div className="col-span-4 p-4 text-sm text-gray-600">
											<span>
												Showing results for:{ ' ' }
												<strong className="font-medium text-black">
													{ debouncedSearchInput }
												</strong>
											</span>
											<Button
												isLink
												onClick={ () => {
													setSearchInput( '' );
													setDebouncedSearchInput(
														''
													);
													setCurrentPage( 0 );
													setImagesCurrentPage( 0 );
												} }
												className="ml-2!"
											>
												Clear
											</Button>
										</div>
									) }
							</div>
							{ /* --- END: Search results indicator --- */ }

							{ /* --- START: New Grid Images code --- */ }
							{ activeTab === 'images' && (
								<>
									<div className="col-span-3 px-4 sm:px-4 sm:pt-6 pt-4">
										{ ( isLoadingImages || isTyping ) && (
											<div className="flex-grow flex items-center justify-center">
												<Spinner />
											</div>
										) }
										{ ! ( isLoadingImages || isTyping ) &&
											noResultsFound && (
												<div className="flex-grow flex items-center justify-center">
													<p className="text-gray-500">
														No results found, please
														try again
													</p>
												</div>
											) }
										{ ! ( isLoadingImages || isTyping ) &&
											! noResultsFound && (
												<>
													{ /* This is the new gallery container */ }
													<div className="sf-fixed-height-gallery">
														{ images.map(
															(
																image,
																imageIndex
															) => {
																const [ w, h ] =
																	image.dimensions
																		.split(
																			'x'
																		)
																		.map(
																			Number
																		);
																const aspectRatio =
																	h > 0
																		? w / h
																		: 1;
																const embedTagHtml =
																	image.embedCode;

																return (
																	<div
																		key={ `${ image.id }-${ imageIndex }` }
																		className={ `group relative cursor-pointer overflow-hidden ring-offset-2 ring-offset-gray-100 ${
																			selectedImage?.id ===
																			image.id
																				? 'ring-2 ring-blue-500'
																				: ''
																		}` }
																		style={ {
																			'--aspect-ratio':
																				aspectRatio,
																		} }
																		role="button"
																		tabIndex={
																			0
																		}
																		onClick={ () => {
																			setSelectedImage(
																				image
																			);
																			setShowCaption(
																				true
																			);
																		} }
																		onKeyDown={ (
																			e
																		) => {
																			if (
																				e.key ===
																					'Enter' ||
																				e.key ===
																					' '
																			) {
																				setSelectedImage(
																					image
																				);
																				setShowCaption(
																					true
																				);
																			}
																		} }
																	>
																		{ embedTagHtml ? (
																			<div
																				className={
																					'block w-full h-full'
																				}
																			>
																				<SmartFrameComponent
																					customerId={
																						image.customerPublicId
																					}
																					imageId={
																						image.photoId
																					}
																					width={
																						image.width
																					}
																					height={
																						image.height
																					}
																				/>
																			</div>
																		) : (
																			<img
																				src={
																					image.thumbnailUrl
																				}
																				alt={
																					image.title
																				}
																				className="block w-full h-full object-contain"
																			/>
																		) }
																		<div className="transition-opacity z-10 duration-300 ease-in-out bg-black opacity-0 group-hover:opacity-20 absolute top-0 left-0 w-full h-full"></div>
																	</div>
																);
															}
														) }
													</div>

													<div className="flex justify-center items-center py-6">
														<Button
															onClick={ () => {
																setImages( [] );
																setImagesCurrentPage(
																	( p ) =>
																		p - 1
																);
															} }
															disabled={
																imagesCurrentPage <=
																	0 ||
																isLoadingImages
															}
															isPrimary={
																imagesCurrentPage >
																	0 &&
																! isLoadingImages
															}
														>
															Previous
														</Button>
														<span className="mx-4 font-bold text-gray-700">
															Page{ ' ' }
															{ imagesCurrentPage +
																1 }{ ' ' }
															of{ ' ' }
															{ imagesTotalPages }
														</span>
														<Button
															onClick={ () => {
																setImages( [] );
																setImagesCurrentPage(
																	( p ) =>
																		p + 1
																);
															} }
															disabled={
																imagesCurrentPage +
																	1 >=
																	imagesTotalPages ||
																isLoadingImages
															}
															isPrimary={
																imagesCurrentPage +
																	1 <
																	imagesTotalPages &&
																! isLoadingImages
															}
														>
															Next
														</Button>
													</div>
												</>
											) }
									</div>
									{ /* Right Column: Details Sidebar */ }
									<aside
										className={
											'h-screen sticky top-0 col-span-1 sfimages-details bg-menu flex flex-col'
										}
									>
										{ selectedImage ? (
											<>
												<div className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto table">
													<div>
														{ selectedImage.embedCode ? (
															<div
																className={
																	'block w-full h-full'
																}
															>
																<SmartFrameComponent
																	customerId={
																		selectedImage.customerPublicId
																	}
																	imageId={
																		selectedImage.photoId
																	}
																	width={
																		selectedImage.width
																	}
																	height={
																		selectedImage.height
																	}
																/>
															</div>
														) : (
															// Fallback to thumbnail if embed code is not available
															<img
																src={
																	selectedImage.thumbnailUrl
																}
																alt={
																	selectedImage.title
																}
																className="w-full object-contain h-[420px]"
															/>
														) }
													</div>
													<div className="py-2">
														<Button
															isPrimary={ true }
															onClick={ () => {
																let finalEmbedCode =
																	selectedImage.embedCode ||
																	'';
																const embedTagStart =
																	'<smartframe-embed';
																if (
																	! showCaption &&
																	finalEmbedCode.includes(
																		embedTagStart
																	)
																) {
																	finalEmbedCode =
																		finalEmbedCode.replace(
																			embedTagStart,
																			`${ embedTagStart } disable-caption `
																		);
																}
																const imageToInsert =
																	{
																		...selectedImage,
																		embedCode:
																			finalEmbedCode,
																	};
																onInsert(
																	imageToInsert
																);
															} }
															disabled={
																! selectedImage
															}
														>
															Insert into post
														</Button>
													</div>
													<div className="space-y-4">
														{ selectedImage.title !==
															'unknown' && (
															<h2
																className={
																	'text-black'
																}
															>
																{
																	selectedImage.title
																}
															</h2>
														) }
														<p>
															{
																selectedImage.caption
															}
														</p>
														<CheckboxControl
															label="Show SmartFrame Image Caption"
															checked={
																showCaption
															}
															onChange={
																setShowCaption
															}
															className="mt-2 mb-4"
														/>
													</div>
													<div className="space-y-2">
														<div className="text-sm space-y-2">
															<div className="flex justify-between">
																<span
																	className={
																		'font-bold text-gray-700'
																	}
																>
																	Image number
																</span>{ ' ' }
																<span className="font-mono text-gray-700">
																	{
																		selectedImage.id
																	}
																</span>
															</div>
															<div className="flex justify-between">
																<span
																	className={
																		'font-bold text-gray-700'
																	}
																>
																	Photographer
																</span>{ ' ' }
																<span className="font-mono text-gray-700">
																	{
																		selectedImage.copyright
																	}
																</span>
															</div>
															<div className="flex justify-between">
																<span
																	className={
																		'font-bold text-gray-700'
																	}
																>
																	Image size
																</span>{ ' ' }
																<span className="font-mono text-gray-700">
																	{
																		selectedImage.dimensions
																	}
																</span>
															</div>
															<div className="flex justify-between">
																<span
																	className={
																		'font-bold text-gray-700'
																	}
																>
																	Date
																</span>{ ' ' }
																<span className="font-mono text-gray-700">
																	{
																		selectedImage.uploadDate
																	}
																</span>
															</div>
														</div>
													</div>
													<div className="space-y-2">
														<h3 className="text-xs font-bold text-gray-600 text-black">
															Keywords
														</h3>
														<div className="flex flex-wrap gap-2">
															{ selectedImage.keywords &&
																selectedImage.keywords.map(
																	(
																		keyword,
																		index
																	) => (
																		<span
																			key={ `${ keyword }-${ index }` }
																			value={
																				keyword
																			}
																			onKeyDown={ (
																				e
																			) => {
																				if (
																					e.key ===
																						'Enter' ||
																					e.key ===
																						' '
																				) {
																					setSearchInput(
																						keyword
																					);
																				}
																			} }
																			role="button"
																			tabIndex={
																				0
																			}
																			onClick={ () =>
																				setSearchInput(
																					keyword
																				)
																			}
																			className={ `cursor-pointer hover:bg-primary-button hover:text-white text-xs font-medium px-2.5 py-1 rounded-full ${
																				searchInput ===
																				keyword
																					? 'bg-primary-button text-white'
																					: 'bg-gray-200 text-gray-800'
																			}` }
																		>
																			{
																				keyword
																			}
																		</span>
																	)
																) }
														</div>
													</div>
												</div>
											</>
										) : (
											<div className="flex items-center justify-center h-full">
												<p className="text-gray-500">
													Select an image to see
													details
												</p>
											</div>
										) }
									</aside>
								</>
							) }
							{ /* --- END IMAGES VIEW --- */ }

							{ /* --- EVENTS VIEW --- */ }
							{ activeTab === 'events' && (
								<div className="col-span-4 px-4 sm:px-4 sm:pt-6 pt-4">
									{ ( isLoadingEvents || isTyping ) && (
										<Spinner />
									) }
									{ ! ( isLoadingEvents || isTyping ) &&
										noResultsFound && (
											<div className="flex-grow flex items-center justify-center">
												<p className="text-gray-500">
													No results found, please try
													again
												</p>
											</div>
										) }
									{ ! ( isLoadingEvents || isTyping ) &&
										! noResultsFound && (
											<>
												<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
													{ events.map( ( event ) => (
														<div
															key={ event.id }
															onClick={ () =>
																handleEventClick(
																	event
																)
															}
															onKeyDown={ (
																e
															) => {
																if (
																	e.key ===
																		'Enter' ||
																	e.key ===
																		' '
																) {
																	handleEventClick(
																		event
																	);
																}
															} }
															role="button"
															tabIndex={ 0 }
															className="relative rounded-lg overflow-hidden group cursor-pointer sfimages-event-holder shadow-lg aspect-4/3"
														>
															<div
																className={
																	'block w-full h-full'
																}
															>
																<SmartFrameComponent
																	customerId={
																		event.customer
																	}
																	imageId={
																		event.folderCoverImagePhotoId
																	}
																	width={
																		event.folderCoverImageWidth
																	}
																	height={
																		event.folderCoverImageHeight
																	}
																/>
															</div>
															<div className="absolute top-0 left-0 w-full h-full event-gradient-overlay z-10"></div>
															<div className="absolute top-0 left-0 w-full h-full p-2 flex flex-col justify-between text-white z-20">
																<p className="text-base text-white">
																	{
																		event.title
																	}
																</p>
																<div className="flex justify-between items-end w-full">
																	<span className="text-base font-medium">
																		{
																			event.totalMediaCount
																		}{ ' ' }
																		{ event.totalMediaCount ===
																		1
																			? 'Image'
																			: 'Images' }
																	</span>
																	{ event
																		.categories[ 0 ] && (
																		<span className="text-base bg-black/50 px-2 py-1 rounded-md capitalize">
																			{
																				event
																					.categories[ 0 ]
																			}
																		</span>
																	) }
																</div>
															</div>
														</div>
													) ) }
												</div>
												<div className="flex justify-center items-center py-6">
													<Button
														onClick={ () =>
															setCurrentPage(
																( p ) => p - 1
															)
														}
														disabled={
															currentPage <= 0 ||
															isLoadingEvents
														}
														isPrimary={
															currentPage > 0 &&
															! isLoadingEvents
														}
													>
														Previous
													</Button>
													<span className="mx-4 font-bold text-gray-700">
														Page { currentPage + 1 }{ ' ' }
														of { totalPages }
													</span>
													<Button
														onClick={ () =>
															setCurrentPage(
																( p ) => p + 1
															)
														}
														disabled={
															currentPage + 1 >=
																totalPages ||
															isLoadingEvents
														}
														isPrimary={
															currentPage + 1 <
																totalPages &&
															! isLoadingEvents
														}
													>
														Next
													</Button>
												</div>
											</>
										) }
								</div>
							) }
							{ /* --- END EVENTS VIEW --- */ }
						</section>
					) : (
						<section className={ 'grid grid-cols-4 gap-0' }>
							<p
								className={
									'col-span-4 error-embed-code text-3xl p-4 text-center'
								}
							>
								Invalid or missing API key. Please check{ ' ' }
								<a
									href={
										'/wp-admin/admin.php?page=smartframe_admin_settings'
									}
									target={ '_blank' }
									rel="noreferrer"
								>
									your settings.
								</a>
							</p>
						</section>
					) ) }
			</div>
		</Modal>
	);
}
