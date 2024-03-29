document.addEventListener("deviceready", onDeviceReady, false);

// The device is ready
function onDeviceReady() {
	XMLHttpRequest.prototype.withCredentials = false;
	$(function () {
		try {
			var client = new WindowsAzure.MobileServiceClient('https://todowoodruff.azure-mobile.net/', 'MvPJDDUUkVtNBaqaFrbkroWzFUVLam17'),
			todoItemTable = client.getTable('todoitem');
		}
		catch (e) {
			navigator.notification.alert('Error: ' + e.description);
		}

		// Read current data and rebuild UI.
		function refreshTodoItems() {
			var query = todoItemTable.where({ complete: false });

			query.read().then(function (todoItems) {
				var listItems = $.map(todoItems, function (item) {
					return $('<li>')
					.attr('data-todoitem-id', item.id)
					.append($('<button class="item-delete">Delete</button>'))
					.append($('<input type="checkbox" class="item-complete">').prop('checked', item.complete))
					.append($('<div>').append($('<input class="item-text">').val(item.text)));
				});

				$('#todo-items').empty().append(listItems).toggle(listItems.length > 0);
				$('#summary').html('<strong>' + todoItems.length + '</strong> item(s)');
			});
		}

		function getTodoItemId(formElement) {
			return Number($(formElement).closest('li').attr('data-todoitem-id'));
		}

		// Handle insert
		$('#add-item').submit(function (evt) {
			var textbox = $('#new-item-text'),
			itemText = textbox.val();
			if (itemText !== '') {
				todoItemTable.insert({ text: itemText, complete: false }).then(refreshTodoItems);
			}
			textbox.val('').focus();
			evt.preventDefault();
		});

		// Handle update
		$(document.body).on('change', '.item-text', function () {
			var newText = $(this).val();
			todoItemTable.update({ id: getTodoItemId(this), text: newText });
		});

		$(document.body).on('change', '.item-complete', function () {
			var isComplete = $(this).prop('checked');
			todoItemTable.update({ id: getTodoItemId(this), complete: isComplete }).then(refreshTodoItems);
		});

		// Handle delete
		$(document.body).on('click', '.item-delete', function () {
			todoItemTable.del({ id: getTodoItemId(this) }).then(refreshTodoItems);
		});

		// On initial load, start by fetching the current data
		//refreshTodoItems();
        
		function refreshAuthDisplay() {
			var isLoggedIn = client.currentUser !== null;
			$("#logged-in").toggle(isLoggedIn);
			$("#logged-out").toggle(!isLoggedIn);

			if (isLoggedIn) {
				$("#login-name").text(client.currentUser.userId);
				refreshTodoItems();
			}
		}

		function logIn() {
			client.login("twitter").then(refreshAuthDisplay, function(error) {
				alert(error);
			});
		}

		function logOut() {
			client.logout();
			refreshAuthDisplay();
			$('#summary').html('<strong>You must login to access data.</strong>');
		}

		// On page init, fetch the data and set up event handlers
		$(function () {
			refreshAuthDisplay();
			$('#summary').html('<strong>You must login to access data.</strong>');          
			$("#logged-out button").click(logIn);
			$("#logged-in button").click(logOut);
		});
	});
}
